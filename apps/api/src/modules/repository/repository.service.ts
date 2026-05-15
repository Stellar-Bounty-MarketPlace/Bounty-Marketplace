import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { GitHubService } from '../pr-verification/github.service';
import { ClassificationService } from '../ai/classification.service';
import { EmbeddingService } from '../ai/embedding.service';
import { CACHE_TTL } from '@bounty/shared';

@Injectable()
export class RepositoryService {
  private readonly logger = new Logger(RepositoryService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
    private github: GitHubService,
    private classification: ClassificationService,
    private embeddings: EmbeddingService,
  ) {}

  async importFromGitHub(fullName: string, maintainerId: string) {
    const [owner, repo] = fullName.split('/');
    if (!owner || !repo) throw new Error('Invalid repository name');

    // Fetch from GitHub API
    const { data: ghRepo } = await this.github['http'].get(`/repos/${fullName}`);

    const repository = await this.db.repository.upsert({
      where: { githubId: String(ghRepo.id) },
      create: {
        githubId: String(ghRepo.id),
        fullName: ghRepo.full_name,
        name: ghRepo.name,
        owner: ghRepo.owner.login,
        description: ghRepo.description,
        url: ghRepo.html_url,
        stars: ghRepo.stargazers_count,
        forks: ghRepo.forks_count,
        openIssues: ghRepo.open_issues_count,
        language: ghRepo.language,
        topics: ghRepo.topics ?? [],
        isPrivate: ghRepo.private,
        maintainerId,
      },
      update: {
        stars: ghRepo.stargazers_count,
        forks: ghRepo.forks_count,
        openIssues: ghRepo.open_issues_count,
        description: ghRepo.description,
      },
    });

    // Trigger async intelligence analysis
    this.analyzeRepository(repository.id).catch((err) =>
      this.logger.error(`Failed to analyze repo ${repository.id}:`, err),
    );

    return repository;
  }

  async analyzeRepository(repositoryId: string) {
    const repo = await this.db.repository.findUnique({ where: { id: repositoryId } });
    if (!repo) throw new NotFoundException('Repository not found');

    const techStack = [
      repo.language,
      ...repo.topics,
      ...Object.keys(repo.languages as Record<string, number>),
    ].filter(Boolean) as string[];

    const aiSummary = await this.classification.generateRepoSummary(
      repo.fullName,
      repo.description ?? '',
      techStack,
      { stars: repo.stars, forks: repo.forks, openIssues: repo.openIssues },
    );

    const healthScore = this.computeHealthScore(repo);

    await Promise.all([
      this.db.repository.update({
        where: { id: repositoryId },
        data: { healthScore, lastAnalyzedAt: new Date() },
      }),
      this.db.repositoryIntelligence.upsert({
        where: { repositoryId },
        create: {
          repositoryId,
          techStack,
          aiSummary,
          activityScore: Math.min(repo.stars / 1000, 1),
          documentationScore: 0.7,
          codebaseComplexity: 0.5,
          contributorDiversity: 0.6,
          issueResolutionTime: 7,
          prMergeTime: 3,
          recommendations: [
            'Add more comprehensive tests',
            'Improve documentation coverage',
          ],
        },
        update: { techStack, aiSummary, activityScore: Math.min(repo.stars / 1000, 1) },
      }),
    ]);

    this.logger.log(`Repository ${repo.fullName} analyzed`);
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.db.repository.findMany({
        skip,
        take: limit,
        orderBy: { stars: 'desc' },
        include: {
          _count: { select: { bounties: true } },
          intelligence: { select: { aiSummary: true, techStack: true } },
        },
      }),
      this.db.repository.count(),
    ]);
    return { data, total, page, limit };
  }

  async findByFullName(fullName: string) {
    const cacheKey = `repo:${fullName}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const repo = await this.db.repository.findUnique({
      where: { fullName },
      include: {
        intelligence: true,
        bounties: {
          where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
          take: 10,
          orderBy: { amount: 'desc' },
        },
        _count: { select: { bounties: true } },
      },
    });

    if (!repo) throw new NotFoundException(`Repository ${fullName} not found`);

    await this.redis.setJson(cacheKey, repo, CACHE_TTL.LONG);
    return repo;
  }

  private computeHealthScore(repo: { stars: number; forks: number; openIssues: number }): number {
    const starScore = Math.min(repo.stars / 5000, 1) * 0.4;
    const forkScore = Math.min(repo.forks / 1000, 1) * 0.3;
    const issueScore = Math.max(0, 1 - repo.openIssues / 500) * 0.3;
    return Math.round((starScore + forkScore + issueScore) * 100) / 100;
  }
}
