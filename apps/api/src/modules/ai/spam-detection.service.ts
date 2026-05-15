import { Injectable, Logger } from '@nestjs/common';
import type { SpamDetectionResult } from '@bounty/shared';
import { AiService } from './ai.service';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SpamDetectionService {
  private readonly logger = new Logger(SpamDetectionService.name);

  constructor(
    private ai: AiService,
    private db: DatabaseService,
  ) {}

  async detectSpam(
    prTitle: string,
    prBody: string,
    contributorId: string,
    bountyId: string,
  ): Promise<SpamDetectionResult> {
    const signals = await Promise.all([
      this.checkDuplicateSubmission(contributorId, bountyId),
      this.checkContributorHistory(contributorId),
      this.aiSpamAnalysis(prTitle, prBody),
    ]);

    const [duplicateSignal, historySignal, aiSignal] = signals;

    const allSignals = [
      ...(duplicateSignal ? [duplicateSignal] : []),
      ...(historySignal ? [historySignal] : []),
      ...aiSignal.signals,
    ];

    const totalWeight = allSignals.reduce((sum, s) => sum + s.weight, 0);
    const confidence = Math.min(totalWeight / 100, 1);
    const isSpam = confidence > 0.6;

    if (isSpam) {
      this.logger.warn(`Spam detected for PR on bounty ${bountyId} by contributor ${contributorId}`);
    }

    return { isSpam, confidence, signals: allSignals };
  }

  private async checkDuplicateSubmission(contributorId: string, bountyId: string) {
    const existing = await this.db.pullRequest.findFirst({
      where: { contributorId, bountyId, isSpam: false },
    });

    if (existing) {
      return {
        type: 'DUPLICATE_SUBMISSION',
        description: 'Contributor already has an active PR for this bounty',
        weight: 80,
      };
    }
    return null;
  }

  private async checkContributorHistory(contributorId: string) {
    const spamCount = await this.db.pullRequest.count({
      where: { contributorId, isSpam: true },
    });

    if (spamCount >= 3) {
      return {
        type: 'SPAM_HISTORY',
        description: `Contributor has ${spamCount} previous spam submissions`,
        weight: Math.min(spamCount * 15, 60),
      };
    }
    return null;
  }

  private async aiSpamAnalysis(title: string, body: string): Promise<SpamDetectionResult> {
    const prompt = `Analyze this pull request for spam signals on a bounty platform.

PR Title: ${title}
PR Body: ${body.slice(0, 2000)}

Return JSON:
{
  "isSpam": <boolean>,
  "confidence": <0.0-1.0>,
  "signals": [{"type": "...", "description": "...", "weight": <0-100>}]
}

Spam signals to check:
- Empty or meaningless description
- Unrelated to typical OSS work
- Copy-pasted generic content
- No technical substance
- Suspicious patterns`;

    try {
      return await this.ai.chatJson<SpamDetectionResult>([
        { role: 'system', content: 'You are a spam detection system. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ]);
    } catch {
      return { isSpam: false, confidence: 0, signals: [] };
    }
  }
}
