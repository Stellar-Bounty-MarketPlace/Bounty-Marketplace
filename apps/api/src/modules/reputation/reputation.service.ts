import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ReputationEventType, ReputationTier } from '@bounty/database';
import { REPUTATION_WEIGHTS, REPUTATION_TIERS } from '@bounty/shared';

import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
  ) {}

  async applyEvent(
    contributorId: string,
    type: ReputationEventType,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const delta = this.getDelta(type, metadata);
    const reason = this.getReason(type, metadata);

    await this.db.$transaction(async (tx) => {
      // Record the event
      await tx.reputationEvent.create({
        data: { contributorId, type, delta, reason, metadata: metadata as Prisma.InputJsonValue },
      });

      // Update the score
      const updated = await tx.contributorProfile.update({
        where: { id: contributorId },
        data: {
          reputationScore: { increment: delta },
        },
      });

      // Recalculate tier
      const newTier = this.calculateTier(updated.reputationScore);
      if (newTier !== updated.reputationTier) {
        await tx.contributorProfile.update({
          where: { id: contributorId },
          data: { reputationTier: newTier },
        });
        this.logger.log(
          `Contributor ${contributorId} tier changed: ${updated.reputationTier} → ${newTier}`,
        );
      }
    });

    await this.redis.del(`contributor:${contributorId}`);
    this.logger.debug(`Reputation event applied: ${type} (${delta > 0 ? '+' : ''}${delta}) for ${contributorId}`);
  }

  async applyBountyCompletion(
    contributorId: string,
    bountyId: string,
    deliveryDays: number,
    estimatedDays: number,
  ): Promise<void> {
    await this.applyEvent(contributorId, ReputationEventType.BOUNTY_COMPLETED, {
      bountyId,
      deliveryDays,
    });

    // Bonus/penalty for delivery timing
    if (deliveryDays < estimatedDays * 0.8) {
      await this.applyEvent(contributorId, ReputationEventType.EARLY_DELIVERY, {
        bountyId,
        daysSaved: estimatedDays - deliveryDays,
      });
    } else if (deliveryDays > estimatedDays * 1.5) {
      await this.applyEvent(contributorId, ReputationEventType.LATE_DELIVERY, {
        bountyId,
        daysLate: deliveryDays - estimatedDays,
      });
    }

    // Update stats
    await this.db.contributorProfile.update({
      where: { id: contributorId },
      data: {
        bountiesCompleted: { increment: 1 },
        avgDeliveryDays: await this.computeNewAvgDelivery(contributorId, deliveryDays),
      },
    });
  }

  async applyMaintainerRating(
    contributorId: string,
    bountyId: string,
    raterId: string,
    score: number,
  ): Promise<void> {
    // Clamp score 1-5
    const clampedScore = Math.max(1, Math.min(5, score));

    await this.db.contributorRating.upsert({
      where: { contributorId_bountyId: { contributorId, bountyId } },
      create: { contributorId, bountyId, raterId, score: clampedScore },
      update: { score: clampedScore },
    });

    await this.applyEvent(contributorId, ReputationEventType.MAINTAINER_RATING, {
      bountyId,
      score: clampedScore,
    });
  }

  async getLeaderboard(limit = 50) {
    const cacheKey = `leaderboard:top${limit}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const contributors = await this.db.contributorProfile.findMany({
      orderBy: { reputationScore: 'desc' },
      take: limit,
      include: {
        user: { select: { displayName: true, avatarUrl: true, githubUsername: true } },
      },
    });

    const result = contributors.map((c, i) => ({
      rank: i + 1,
      contributor: {
        id: c.id,
        githubUsername: c.githubUsername,
        displayName: c.user.displayName,
        avatarUrl: c.user.avatarUrl,
        reputationTier: c.reputationTier,
      },
      reputationScore: c.reputationScore,
      bountiesCompleted: c.bountiesCompleted,
      totalEarned: Number(c.totalEarned),
      successRate:
        c.bountiesAttempted > 0 ? c.bountiesCompleted / c.bountiesAttempted : 0,
      trend: 'stable' as const,
      trendDelta: 0,
    }));

    await this.redis.setJson(cacheKey, result, 300);
    return result;
  }

  private getDelta(type: ReputationEventType, metadata: Record<string, unknown>): number {
    switch (type) {
      case ReputationEventType.BOUNTY_COMPLETED: return REPUTATION_WEIGHTS.BOUNTY_COMPLETED;
      case ReputationEventType.BOUNTY_FAILED: return REPUTATION_WEIGHTS.BOUNTY_FAILED;
      case ReputationEventType.PR_MERGED: return REPUTATION_WEIGHTS.PR_MERGED;
      case ReputationEventType.PR_REJECTED: return REPUTATION_WEIGHTS.PR_REJECTED;
      case ReputationEventType.DISPUTE_WON: return REPUTATION_WEIGHTS.DISPUTE_WON;
      case ReputationEventType.DISPUTE_LOST: return REPUTATION_WEIGHTS.DISPUTE_LOST;
      case ReputationEventType.EARLY_DELIVERY: return REPUTATION_WEIGHTS.EARLY_DELIVERY;
      case ReputationEventType.LATE_DELIVERY: return REPUTATION_WEIGHTS.LATE_DELIVERY;
      case ReputationEventType.SPAM_DETECTED: return REPUTATION_WEIGHTS.SPAM_DETECTED;
      case ReputationEventType.MAINTAINER_RATING: {
        const score = metadata['score'] as number;
        const key = `MAINTAINER_RATING_${score}` as keyof typeof REPUTATION_WEIGHTS;
        return REPUTATION_WEIGHTS[key] ?? 0;
      }
      default: return 0;
    }
  }

  private getReason(type: ReputationEventType, metadata: Record<string, unknown>): string {
    const reasons: Record<ReputationEventType, string> = {
      [ReputationEventType.BOUNTY_COMPLETED]: 'Successfully completed a bounty',
      [ReputationEventType.BOUNTY_FAILED]: 'Failed to complete an assigned bounty',
      [ReputationEventType.PR_MERGED]: 'Pull request was merged',
      [ReputationEventType.PR_REJECTED]: 'Pull request was rejected',
      [ReputationEventType.DISPUTE_WON]: 'Won a dispute resolution',
      [ReputationEventType.DISPUTE_LOST]: 'Lost a dispute resolution',
      [ReputationEventType.MAINTAINER_RATING]: `Received ${metadata['score']}/5 maintainer rating`,
      [ReputationEventType.EARLY_DELIVERY]: 'Delivered ahead of schedule',
      [ReputationEventType.LATE_DELIVERY]: 'Delivered behind schedule',
      [ReputationEventType.SPAM_DETECTED]: 'Spam submission detected',
    };
    return reasons[type] ?? 'Reputation event';
  }

  private calculateTier(score: number): ReputationTier {
    for (const [tier, range] of Object.entries(REPUTATION_TIERS)) {
      if (score >= range.min && score <= range.max) {
        return tier as ReputationTier;
      }
    }
    return ReputationTier.NEWCOMER;
  }

  private async computeNewAvgDelivery(contributorId: string, newDays: number): Promise<number> {
    const contributor = await this.db.contributorProfile.findUnique({
      where: { id: contributorId },
      select: { avgDeliveryDays: true, bountiesCompleted: true },
    });
    if (!contributor) return newDays;

    const count = contributor.bountiesCompleted;
    const currentAvg = contributor.avgDeliveryDays ?? newDays;
    // Exponential moving average
    return (currentAvg * count + newDays) / (count + 1);
  }
}
