import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { AiService } from './ai.service';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private ai: AiService,
  ) {}

  /**
   * Generate and store embedding for a bounty.
   * The embedding captures title, description, tags, and category
   * for semantic similarity matching.
   */
  async indexBounty(bountyId: string): Promise<void> {
    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { repository: { select: { language: true, topics: true } } },
    });
    if (!bounty) return;

    const text = [
      bounty.title,
      bounty.description,
      bounty.category,
      bounty.difficulty,
      ...bounty.tags,
      bounty.repository.language ?? '',
      ...bounty.repository.topics,
    ].join(' ');

    const vector = await this.ai.embed(text);

    // Store via raw SQL since Prisma doesn't support pgvector writes natively
    await this.db.$executeRaw`
      UPDATE bounties
      SET embedding = ${`[${vector.join(',')}]`}::vector
      WHERE id = ${bountyId}::uuid
    `;

    this.logger.debug(`Indexed bounty embedding: ${bountyId}`);
  }

  /**
   * Generate and store embedding for a contributor profile.
   * Captures skills, languages, bio, and contribution history.
   */
  async indexContributor(contributorId: string): Promise<void> {
    const contributor = await this.db.contributorProfile.findUnique({
      where: { id: contributorId },
      include: { languageStats: true },
    });
    if (!contributor) return;

    const githubStats = contributor.githubStats as Record<string, unknown> | null;

    const text = [
      contributor.bio ?? '',
      ...contributor.skills,
      ...contributor.languageStats.map((l) => `${l.language} ${l.level}`),
      `reputation: ${contributor.reputationTier}`,
      `completed: ${contributor.bountiesCompleted} bounties`,
      githubStats ? JSON.stringify(githubStats).slice(0, 500) : '',
    ].join(' ');

    const vector = await this.ai.embed(text);

    await this.db.$executeRaw`
      UPDATE contributor_profiles
      SET embedding = ${`[${vector.join(',')}]`}::vector
      WHERE id = ${contributorId}::uuid
    `;

    this.logger.debug(`Indexed contributor embedding: ${contributorId}`);
  }

  /**
   * Find top-N contributors most semantically similar to a bounty.
   * Uses pgvector cosine distance for fast ANN search.
   */
  async findSimilarContributors(
    bountyId: string,
    limit = 10,
  ): Promise<Array<{ id: string; similarity: number }>> {
    const results = await this.db.$queryRaw<Array<{ id: string; similarity: number }>>`
      SELECT
        cp.id,
        1 - (cp.embedding <=> b.embedding) AS similarity
      FROM contributor_profiles cp
      CROSS JOIN bounties b
      WHERE b.id = ${bountyId}::uuid
        AND cp.embedding IS NOT NULL
        AND b.embedding IS NOT NULL
      ORDER BY cp.embedding <=> b.embedding
      LIMIT ${limit}
    `;

    return results;
  }
}
