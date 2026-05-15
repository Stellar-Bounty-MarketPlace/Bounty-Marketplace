import { Injectable, Logger } from '@nestjs/common';
import type { ContributorMatch } from '@bounty/shared';
import { AI_MATCH_LIMIT } from '@bounty/shared';

import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';
import { CACHE_TTL } from '@bounty/shared';

const MODEL_VERSION = '1.0.0';

@Injectable()
export class MatchingEngine {
  private readonly logger = new Logger(MatchingEngine.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private ai: AiService,
    private embeddings: EmbeddingService,
  ) {}

  async computeMatches(bountyId: string, limit = AI_MATCH_LIMIT): Promise<ContributorMatch[]> {
    const cacheKey = `ai:matches:${bountyId}`;
    const cached = await this.redis.getJson<ContributorMatch[]>(cacheKey);
    if (cached) return cached;

    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { repository: true },
    });
    if (!bounty) return [];

    // Step 1: Vector similarity search
    const similarContributors = await this.embeddings.findSimilarContributors(bountyId, limit * 3);

    if (!similarContributors.length) return [];

    const contributorIds = similarContributors.map((c) => c.id);
    const contributors = await this.db.contributorProfile.findMany({
      where: { id: { in: contributorIds } },
      include: {
        languageStats: true,
        user: { select: { displayName: true, avatarUrl: true, githubUsername: true } },
        reputationEvents: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    // Step 2: Score each candidate with multi-factor ranking
    const scored = await Promise.all(
      contributors.map(async (contributor) => {
        const similarity = similarContributors.find((s) => s.id === contributor.id)?.similarity ?? 0;
        return this.scoreContributor(contributor, bounty, similarity);
      }),
    );

    // Step 3: Sort by fit score and take top N
    const matches = scored
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, limit);

    // Step 4: Persist matches to DB for analytics
    await this.persistMatches(bountyId, matches);

    await this.redis.setJson(cacheKey, matches, CACHE_TTL.LONG);
    return matches;
  }

  private async scoreContributor(
    contributor: Awaited<ReturnType<DatabaseService['contributorProfile']['findMany']>>[0],
    bounty: Awaited<ReturnType<DatabaseService['bounty']['findUnique']>> & object,
    semanticSimilarity: number,
  ): Promise<ContributorMatch> {
    const weights = {
      semantic: 0.35,
      reputation: 0.20,
      successRate: 0.20,
      languageMatch: 0.15,
      deliverySpeed: 0.10,
    };

    // Reputation score (normalized 0-1)
    const reputationNorm = Math.min(contributor.reputationScore / 5000, 1);

    // Success rate
    const successRate =
      contributor.bountiesAttempted > 0
        ? contributor.bountiesCompleted / contributor.bountiesAttempted
        : 0;

    // Language match
    const repoLanguage = (bounty as { repository: { language: string | null } }).repository.language?.toLowerCase();
    const languageMatch = repoLanguage
      ? contributor.languageStats.some(
          (l) => l.language.toLowerCase() === repoLanguage && ['ADVANCED', 'EXPERT'].includes(l.level),
        )
        ? 1
        : contributor.languageStats.some((l) => l.language.toLowerCase() === repoLanguage)
        ? 0.5
        : 0
      : 0.5;

    // Delivery speed (faster = better, normalized)
    const avgDays = contributor.avgDeliveryDays ?? 14;
    const deliveryScore = Math.max(0, 1 - avgDays / 30);

    const fitScore =
      semanticSimilarity * weights.semantic +
      reputationNorm * weights.reputation +
      successRate * weights.successRate +
      languageMatch * weights.languageMatch +
      deliveryScore * weights.deliverySpeed;

    const confidenceScore = Math.min(
      0.5 + contributor.bountiesCompleted * 0.02,
      0.99,
    );

    const matchReasons: string[] = [];
    if (semanticSimilarity > 0.7) matchReasons.push('Strong semantic match with bounty requirements');
    if (languageMatch === 1) matchReasons.push(`Expert in ${(bounty as { repository: { language: string | null } }).repository.language}`);
    if (successRate > 0.8) matchReasons.push(`${Math.round(successRate * 100)}% bounty success rate`);
    if (contributor.reputationTier === 'ELITE' || contributor.reputationTier === 'EXPERT') {
      matchReasons.push(`${contributor.reputationTier} tier contributor`);
    }

    const riskFactors: string[] = [];
    if (contributor.bountiesAttempted < 3) riskFactors.push('Limited bounty history');
    if (avgDays > 14) riskFactors.push('Above-average delivery time');
    if (successRate < 0.6 && contributor.bountiesAttempted > 5) riskFactors.push('Below-average success rate');

    return {
      contributor: {
        id: contributor.id,
        userId: contributor.userId,
        githubUsername: contributor.githubUsername,
        githubId: '',
        displayName: contributor.user.displayName,
        avatarUrl: contributor.user.avatarUrl,
        bio: contributor.bio ?? undefined,
        skills: contributor.skills,
        languages: contributor.languageStats.map((l) => ({
          language: l.language,
          level: l.level as import('@bounty/shared').LanguageProficiency['level'],
          linesOfCode: Number(l.linesOfCode),
          repoCount: l.repoCount,
        })),
        reputationScore: contributor.reputationScore,
        reputationTier: contributor.reputationTier as import('@bounty/shared').ReputationTier,
        totalEarned: Number(contributor.totalEarned),
        bountiesCompleted: contributor.bountiesCompleted,
        bountiesAttempted: contributor.bountiesAttempted,
        successRate,
        avgDeliveryDays: avgDays,
        createdAt: contributor.createdAt.toISOString(),
        updatedAt: contributor.updatedAt.toISOString(),
      },
      fitScore: Math.round(fitScore * 100) / 100,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      matchReasons,
      riskFactors,
      estimatedDeliveryDays: Math.round(avgDays),
      relevantExperience: [],
    };
  }

  private async persistMatches(bountyId: string, matches: ContributorMatch[]) {
    await this.db.aIMatch.deleteMany({ where: { bountyId } });
    await this.db.aIMatch.createMany({
      data: matches.map((m) => ({
        bountyId,
        contributorId: m.contributor.id,
        fitScore: m.fitScore,
        confidenceScore: m.confidenceScore,
        matchReasons: m.matchReasons,
        riskFactors: m.riskFactors,
        estimatedDays: m.estimatedDeliveryDays,
        modelVersion: MODEL_VERSION,
      })),
    });
  }
}
