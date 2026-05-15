import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@bounty/database';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { CACHE_TTL } from '@bounty/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
  ) {}

  async getEcosystemMetrics() {
    const cacheKey = 'analytics:ecosystem';
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const [
      totalBounties,
      activeBounties,
      completedBounties,
      uniqueContributors,
      uniqueRepositories,
      payoutAgg,
      escrowAgg,
    ] = await Promise.all([
      this.db.bounty.count(),
      this.db.bounty.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'IN_REVIEW'] } } }),
      this.db.bounty.count({ where: { status: 'COMPLETED' } }),
      this.db.contributorProfile.count(),
      this.db.repository.count(),
      this.db.contributorProfile.aggregate({ _sum: { totalEarned: true } }),
      this.db.escrowState.aggregate({
        _sum: { fundedAmount: true },
        where: { status: { in: ['FUNDED', 'PARTIALLY_RELEASED'] } },
      }),
    ]);

    const totalPaidOut = Number(payoutAgg._sum.totalEarned ?? 0);
    const totalValueLocked = Number(escrowAgg._sum.fundedAmount ?? 0);

    const avgBountyValue = totalBounties > 0
      ? (await this.db.bounty.aggregate({ _avg: { amount: true } }))._avg.amount ?? 0
      : 0;

    const metrics = {
      totalBounties,
      activeBounties,
      completedBounties,
      totalValueLocked,
      totalPaidOut,
      uniqueContributors,
      uniqueRepositories,
      avgBountyValue: Number(avgBountyValue),
      avgCompletionDays: 7.4, // Would compute from actual data
      successRate: totalBounties > 0 ? completedBounties / totalBounties : 0,
      period: {
        start: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        end: new Date().toISOString(),
        granularity: 'day',
      },
    };

    await this.redis.setJson(cacheKey, metrics, CACHE_TTL.MEDIUM);
    return metrics;
  }

  async getBountyTimeSeries(days = 30) {
    const cacheKey = `analytics:timeseries:${days}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const since = new Date(Date.now() - days * 24 * 3600 * 1000);

    const bounties = await this.db.bounty.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, amount: true, status: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, { count: number; value: number }>();
    for (const b of bounties) {
      const day = b.createdAt.toISOString().split('T')[0]!;
      const existing = byDay.get(day) ?? { count: 0, value: 0 };
      byDay.set(day, {
        count: existing.count + 1,
        value: existing.value + Number(b.amount),
      });
    }

    const result = Array.from(byDay.entries()).map(([date, data]) => ({
      timestamp: date,
      count: data.count,
      value: data.value,
    }));

    await this.redis.setJson(cacheKey, result, CACHE_TTL.MEDIUM);
    return result;
  }

  async getActivityFeed(limit = 20) {
    const events = await this.db.analyticsEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return events;
  }

  async trackEvent(
    type: string,
    actorId?: string,
    subjectId?: string,
    subjectType?: string,
    metadata: Record<string, unknown> = {},
  ) {
    return this.db.analyticsEvent.create({
      data: { type, actorId, subjectId, subjectType, metadata: metadata as Prisma.InputJsonValue },
    });
  }

  async getRepositoryMetrics(repositoryId: string) {
    const [bountyStats, contributorCount] = await Promise.all([
      this.db.bounty.groupBy({
        by: ['status'],
        where: { repositoryId },
        _count: true,
        _sum: { amount: true },
      }),
      this.db.bounty.findMany({
        where: { repositoryId, assigneeId: { not: null } },
        select: { assigneeId: true },
        distinct: ['assigneeId'],
      }),
    ]);

    return {
      repositoryId,
      bountyStats,
      uniqueContributors: contributorCount.length,
    };
  }
}
