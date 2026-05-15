import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { GitHubService } from '../pr-verification/github.service';
import { EmbeddingService } from '../ai/embedding.service';
import { CACHE_TTL } from '@bounty/shared';

@Injectable()
export class ContributorService {
  private readonly logger = new Logger(ContributorService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private github: GitHubService,
    private embeddings: EmbeddingService,
  ) {}

  async findByUsername(username: string) {
    const cacheKey = `contributor:username:${username}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const contributor = await this.db.contributorProfile.findUnique({
      where: { githubUsername: username },
      include: {
        user: { select: { displayName: true, avatarUrl: true, email: true, walletAddress: true } },
        languageStats: { orderBy: { linesOfCode: 'desc' } },
        reputationEvents: { orderBy: { createdAt: 'desc' }, take: 10 },
        ratings: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignedBounties: {
          where: { status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
          take: 10,
          include: { repository: { select: { fullName: true } } },
        },
      },
    });

    if (!contributor) throw new NotFoundException(`Contributor ${username} not found`);

    await this.redis.setJson(cacheKey, contributor, CACHE_TTL.MEDIUM);
    return contributor;
  }

  async findById(id: string) {
    const cacheKey = `contributor:${id}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const contributor = await this.db.contributorProfile.findUnique({
      where: { id },
      include: {
        user: { select: { displayName: true, avatarUrl: true, walletAddress: true } },
        languageStats: { orderBy: { linesOfCode: 'desc' } },
        reputationEvents: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!contributor) throw new NotFoundException(`Contributor ${id} not found`);

    await this.redis.setJson(cacheKey, contributor, CACHE_TTL.MEDIUM);
    return contributor;
  }

  async syncFromGitHub(contributorId: string): Promise<void> {
    const contributor = await this.db.contributorProfile.findUnique({
      where: { id: contributorId },
    });
    if (!contributor) throw new NotFoundException('Contributor not found');

    const githubData = await this.github.syncContributorProfile(contributor.githubUsername);

    await this.db.contributorProfile.update({
      where: { id: contributorId },
      data: {
        githubStats: githubData.githubStats,
        lastSyncedAt: new Date(),
      },
    });

    // Re-index embedding after sync
    await this.embeddings.indexContributor(contributorId);

    await this.redis.del(`contributor:${contributorId}`);
    await this.redis.del(`contributor:username:${contributor.githubUsername}`);

    this.logger.log(`Synced contributor ${contributor.githubUsername} from GitHub`);
  }

  async updateWallet(userId: string, walletAddress: string) {
    return this.db.user.update({
      where: { id: userId },
      data: { walletAddress },
      select: { id: true, walletAddress: true },
    });
  }

  async search(query: string, limit = 20) {
    return this.db.contributorProfile.findMany({
      where: {
        OR: [
          { githubUsername: { contains: query, mode: 'insensitive' } },
          { user: { displayName: { contains: query, mode: 'insensitive' } } },
          { skills: { has: query } },
        ],
      },
      take: limit,
      include: {
        user: { select: { displayName: true, avatarUrl: true } },
      },
      orderBy: { reputationScore: 'desc' },
    });
  }
}
