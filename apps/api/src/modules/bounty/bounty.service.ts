import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BountyStatus, UserRole } from '@bounty/database';
import { paginate, getPaginationOffset } from '@bounty/shared';
import type { CreateBountyDto, BountyFilter } from '@bounty/shared';

import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { NotificationService } from '../notification/notification.service';
import { CACHE_TTL } from '@bounty/shared';

@Injectable()
export class BountyService {
  private readonly logger = new Logger(BountyService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private notifications: NotificationService,
  ) {}

  async create(dto: CreateBountyDto, creatorId: string) {
    // Verify repository exists
    const repo = await this.db.repository.findUnique({
      where: { id: dto.repositoryId },
    });
    if (!repo) throw new NotFoundException('Repository not found');

    const bounty = await this.db.bounty.create({
      data: {
        title: dto.title,
        description: dto.description,
        difficulty: dto.difficulty as unknown as import('@bounty/database').BountyDifficulty,
        category: dto.category as unknown as import('@bounty/database').BountyCategory,
        amount: dto.amount,
        currency: dto.currency,
        repositoryId: dto.repositoryId,
        issueNumber: dto.issueNumber,
        issueUrl: dto.issueUrl,
        creatorId,
        tags: dto.tags ?? [],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        status: BountyStatus.OPEN,
        milestones: dto.milestones
          ? {
              create: dto.milestones.map((m, i) => ({
                title: m.title,
                description: m.description,
                amount: m.amount,
                currency: m.currency,
                dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
                order: i,
              })),
            }
          : undefined,
      },
      include: {
        milestones: true,
        repository: true,
        creator: { select: { id: true, displayName: true, avatarUrl: true, githubUsername: true } },
      },
    });

    await this.invalidateBountyCache();
    this.logger.log(`Bounty created: ${bounty.id} by ${creatorId}`);
    return bounty;
  }

  async findAll(filter: BountyFilter) {
    const cacheKey = `bounties:list:${JSON.stringify(filter)}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = getPaginationOffset(page, limit);

    const where = this.buildWhereClause(filter);

    const [data, total] = await Promise.all([
      this.db.bounty.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.buildOrderBy(filter),
        include: {
          repository: { select: { id: true, fullName: true, owner: true, language: true } },
          creator: { select: { id: true, displayName: true, avatarUrl: true, githubUsername: true } },
          assignee: {
            select: {
              id: true,
              githubUsername: true,
              reputationTier: true,
              user: { select: { displayName: true, avatarUrl: true } },
            },
          },
          _count: { select: { pullRequests: true } },
        },
      }),
      this.db.bounty.count({ where }),
    ]);

    const result = paginate(data, total, page, limit);
    await this.redis.setJson(cacheKey, result, CACHE_TTL.SHORT);
    return result;
  }

  async findById(id: string) {
    const cacheKey = `bounty:${id}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const bounty = await this.db.bounty.findUnique({
      where: { id },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        repository: true,
        creator: { select: { id: true, displayName: true, avatarUrl: true, githubUsername: true } },
        assignee: {
          include: { user: { select: { displayName: true, avatarUrl: true } } },
        },
        pullRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        escrowState: true,
        disputes: { orderBy: { createdAt: 'desc' } },
        aiMatches: {
          orderBy: { fitScore: 'desc' },
          take: 5,
          include: {
            // We'll join contributor data separately
          },
        },
      },
    });

    if (!bounty) throw new NotFoundException(`Bounty ${id} not found`);

    await this.redis.setJson(cacheKey, bounty, CACHE_TTL.MEDIUM);
    return bounty;
  }

  async assign(bountyId: string, contributorId: string, requesterId: string) {
    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { creator: true },
    });

    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.status !== BountyStatus.OPEN) {
      throw new BadRequestException(`Cannot assign bounty in status: ${bounty.status}`);
    }
    if (bounty.creatorId !== requesterId) {
      throw new ForbiddenException('Only the bounty creator can assign contributors');
    }

    const contributor = await this.db.contributorProfile.findUnique({
      where: { id: contributorId },
      include: { user: true },
    });
    if (!contributor) throw new NotFoundException('Contributor not found');

    const updated = await this.db.bounty.update({
      where: { id: bountyId },
      data: {
        assigneeId: contributorId,
        status: BountyStatus.IN_PROGRESS,
      },
    });

    await this.notifications.send(contributor.userId, {
      type: 'BOUNTY_ASSIGNED',
      title: 'You have been assigned a bounty',
      body: `You've been assigned to: "${bounty.title}"`,
      metadata: { bountyId },
    });

    await this.invalidateBountyCache(bountyId);
    return updated;
  }

  async submitForReview(bountyId: string, contributorId: string) {
    const bounty = await this.db.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.assigneeId !== contributorId) {
      throw new ForbiddenException('Only the assigned contributor can submit for review');
    }
    if (bounty.status !== BountyStatus.IN_PROGRESS) {
      throw new BadRequestException('Bounty is not in progress');
    }

    const updated = await this.db.bounty.update({
      where: { id: bountyId },
      data: { status: BountyStatus.IN_REVIEW },
    });

    await this.invalidateBountyCache(bountyId);
    return updated;
  }

  async approve(bountyId: string, requesterId: string) {
    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { assignee: { include: { user: true } } },
    });

    if (!bounty) throw new NotFoundException('Bounty not found');
    if (bounty.creatorId !== requesterId) {
      throw new ForbiddenException('Only the bounty creator can approve');
    }
    if (bounty.status !== BountyStatus.IN_REVIEW) {
      throw new BadRequestException('Bounty is not in review');
    }

    const updated = await this.db.bounty.update({
      where: { id: bountyId },
      data: { status: BountyStatus.COMPLETED },
    });

    if (bounty.assignee) {
      await this.notifications.send(bounty.assignee.userId, {
        type: 'BOUNTY_COMPLETED',
        title: 'Bounty approved!',
        body: `Your work on "${bounty.title}" has been approved. Payout incoming.`,
        metadata: { bountyId },
      });
    }

    await this.invalidateBountyCache(bountyId);
    return updated;
  }

  async cancel(bountyId: string, requesterId: string, requesterRole: UserRole) {
    const bounty = await this.db.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');

    const canCancel =
      bounty.creatorId === requesterId ||
      requesterRole === UserRole.ADMIN;

    if (!canCancel) throw new ForbiddenException('Insufficient permissions to cancel');

    const cancellableStatuses: BountyStatus[] = [BountyStatus.OPEN, BountyStatus.DRAFT];
    if (!cancellableStatuses.includes(bounty.status)) {
      throw new BadRequestException(`Cannot cancel bounty in status: ${bounty.status}`);
    }

    const updated = await this.db.bounty.update({
      where: { id: bountyId },
      data: { status: BountyStatus.CANCELLED },
    });

    await this.invalidateBountyCache(bountyId);
    return updated;
  }

  async openDispute(bountyId: string, raisedById: string, reason: string, evidence?: string) {
    const bounty = await this.db.bounty.findUnique({ where: { id: bountyId } });
    if (!bounty) throw new NotFoundException('Bounty not found');

    const disputeableStatuses: BountyStatus[] = [BountyStatus.IN_REVIEW, BountyStatus.IN_PROGRESS];
    if (!disputeableStatuses.includes(bounty.status)) {
      throw new BadRequestException('Cannot open dispute for this bounty status');
    }

    const [dispute] = await Promise.all([
      this.db.dispute.create({
        data: { bountyId, raisedById, reason, evidence },
      }),
      this.db.bounty.update({
        where: { id: bountyId },
        data: { status: BountyStatus.DISPUTED },
      }),
    ]);

    await this.invalidateBountyCache(bountyId);
    return dispute;
  }

  private buildWhereClause(filter: BountyFilter) {
    return {
      ...(filter.status?.length && { status: { in: filter.status as unknown as BountyStatus[] } }),
      ...(filter.difficulty?.length && { difficulty: { in: filter.difficulty as unknown as import('@bounty/database').BountyDifficulty[] } }),
      ...(filter.category?.length && { category: { in: filter.category as unknown as import('@bounty/database').BountyCategory[] } }),
      ...(filter.repositoryId && { repositoryId: filter.repositoryId }),
      ...(filter.minAmount !== undefined && { amount: { gte: filter.minAmount } }),
      ...(filter.maxAmount !== undefined && { amount: { lte: filter.maxAmount } }),
      ...(filter.tags?.length && { tags: { hasSome: filter.tags } }),
      ...(filter.search && {
        OR: [
          { title: { contains: filter.search, mode: 'insensitive' as const } },
          { description: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      }),
    };
  }

  private buildOrderBy(filter: BountyFilter) {
    const order = filter.sortOrder ?? 'desc';
    switch (filter.sortBy) {
      case 'amount': return { amount: order };
      case 'expiresAt': return { expiresAt: order };
      default: return { createdAt: order };
    }
  }

  private async invalidateBountyCache(bountyId?: string) {
    if (bountyId) await this.redis.del(`bounty:${bountyId}`);
    await this.redis.delPattern('bounties:list:*');
  }
}
