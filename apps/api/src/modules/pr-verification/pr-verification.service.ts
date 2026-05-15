import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GitHubService } from './github.service';
import { SpamDetectionService } from '../ai/spam-detection.service';
import { ReputationService } from '../reputation/reputation.service';
import { ReputationEventType } from '@bounty/database';

export interface LinkPRDto {
  bountyId: string;
  prUrl: string;
  contributorId: string;
}

@Injectable()
export class PrVerificationService {
  private readonly logger = new Logger(PrVerificationService.name);

  constructor(
    private db: DatabaseService,
    private github: GitHubService,
    private spamDetection: SpamDetectionService,
    private reputation: ReputationService,
  ) {}

  async linkAndVerifyPR(dto: LinkPRDto) {
    const { bountyId, prUrl, contributorId } = dto;

    // Parse GitHub PR URL
    const parsed = this.parsePRUrl(prUrl);
    if (!parsed) throw new BadRequestException('Invalid GitHub PR URL');

    const bounty = await this.db.bounty.findUnique({
      where: { id: bountyId },
      include: { repository: true },
    });
    if (!bounty) throw new NotFoundException('Bounty not found');

    // Fetch PR from GitHub
    const ghPR = await this.github.getPullRequest(parsed.owner, parsed.repo, parsed.prNumber);

    // Run spam detection
    const spamResult = await this.spamDetection.detectSpam(
      ghPR.title,
      ghPR.body ?? '',
      contributorId,
      bountyId,
    );

    // Compute quality signals
    const qualityScore = this.computeQualityScore(ghPR);

    // Upsert PR record
    const pr = await this.db.pullRequest.upsert({
      where: {
        bountyId_githubPrId: {
          bountyId,
          githubPrId: String(ghPR.id),
        },
      },
      create: {
        bountyId,
        contributorId,
        githubPrId: String(ghPR.id),
        prNumber: ghPR.number,
        title: ghPR.title,
        url: ghPR.html_url,
        state: ghPR.state === 'open' ? 'OPEN' : ghPR.merged ? 'MERGED' : 'CLOSED',
        isMerged: ghPR.merged,
        mergedAt: ghPR.merged_at ? new Date(ghPR.merged_at) : undefined,
        isSpam: spamResult.isSpam,
        qualityScore,
        verificationData: {
          spamResult,
          commits: ghPR.commits,
          additions: ghPR.additions,
          deletions: ghPR.deletions,
        },
        commits: ghPR.commits,
        additions: ghPR.additions,
        deletions: ghPR.deletions,
        changedFiles: ghPR.changed_files,
      },
      update: {
        state: ghPR.state === 'open' ? 'OPEN' : ghPR.merged ? 'MERGED' : 'CLOSED',
        isMerged: ghPR.merged,
        mergedAt: ghPR.merged_at ? new Date(ghPR.merged_at) : undefined,
        isSpam: spamResult.isSpam,
        qualityScore,
      },
    });

    // Apply reputation events
    if (spamResult.isSpam) {
      await this.reputation.applyEvent(contributorId, ReputationEventType.SPAM_DETECTED, {
        bountyId,
        prId: pr.id,
      });
    } else if (ghPR.merged) {
      await this.reputation.applyEvent(contributorId, ReputationEventType.PR_MERGED, {
        bountyId,
        prId: pr.id,
      });
    }

    this.logger.log(
      `PR verified: ${prUrl} | spam=${spamResult.isSpam} | quality=${qualityScore.toFixed(2)}`,
    );

    return { pr, spamResult, qualityScore };
  }

  async syncPRStatus(prId: string) {
    const pr = await this.db.pullRequest.findUnique({
      where: { id: prId },
      include: { bounty: { include: { repository: true } } },
    });
    if (!pr) throw new NotFoundException('PR not found');

    const [owner, repo] = pr.bounty.repository.fullName.split('/');
    if (!owner || !repo) throw new BadRequestException('Invalid repository name');

    const ghPR = await this.github.getPullRequest(owner, repo, pr.prNumber);

    return this.db.pullRequest.update({
      where: { id: prId },
      data: {
        state: ghPR.state === 'open' ? 'OPEN' : ghPR.merged ? 'MERGED' : 'CLOSED',
        isMerged: ghPR.merged,
        mergedAt: ghPR.merged_at ? new Date(ghPR.merged_at) : undefined,
      },
    });
  }

  private parsePRUrl(url: string): { owner: string; repo: string; prNumber: number } | null {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (!match) return null;
    return {
      owner: match[1]!,
      repo: match[2]!,
      prNumber: parseInt(match[3]!, 10),
    };
  }

  private computeQualityScore(pr: { commits: number; additions: number; deletions: number; changed_files: number }): number {
    let score = 0.5; // baseline

    // Reward meaningful changes
    if (pr.changed_files > 0 && pr.changed_files <= 20) score += 0.1;
    if (pr.additions > 10) score += 0.1;
    if (pr.commits >= 1 && pr.commits <= 10) score += 0.1;

    // Penalize suspiciously large or tiny PRs
    if (pr.additions > 5000) score -= 0.2;
    if (pr.additions < 5 && pr.deletions < 5) score -= 0.2;

    return Math.max(0, Math.min(1, score));
  }
}
