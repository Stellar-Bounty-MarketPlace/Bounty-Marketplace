import { Injectable, Logger } from '@nestjs/common';
import type { IssueClassification, ExecutionRiskAssessment } from '@bounty/shared';
import { AiService } from './ai.service';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);

  constructor(private ai: AiService) {}

  async classifyIssue(
    title: string,
    body: string,
    repoContext?: string,
  ): Promise<IssueClassification> {
    const prompt = `You are an expert OSS issue classifier. Analyze this GitHub issue and return a JSON classification.

Issue Title: ${title}
Issue Body: ${body.slice(0, 3000)}
${repoContext ? `Repository Context: ${repoContext}` : ''}

Return JSON with this exact shape:
{
  "category": "BUG_FIX|FEATURE|DOCUMENTATION|SECURITY|PERFORMANCE|TESTING|REFACTOR|DESIGN|DEVOPS|OTHER",
  "difficulty": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT",
  "estimatedHours": <number 1-200>,
  "requiredSkills": ["skill1", "skill2"],
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`;

    return this.ai.chatJson<IssueClassification>([
      { role: 'system', content: 'You are a precise JSON-only responder. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ]);
  }

  async assessExecutionRisk(
    bountyTitle: string,
    bountyDescription: string,
    contributorHistory: {
      bountiesCompleted: number;
      successRate: number;
      avgDeliveryDays: number;
      reputationTier: string;
    },
  ): Promise<ExecutionRiskAssessment> {
    const prompt = `Assess the execution risk for this bounty assignment.

Bounty: ${bountyTitle}
Description: ${bountyDescription.slice(0, 1000)}

Contributor Stats:
- Completed bounties: ${contributorHistory.bountiesCompleted}
- Success rate: ${Math.round(contributorHistory.successRate * 100)}%
- Avg delivery: ${contributorHistory.avgDeliveryDays} days
- Reputation tier: ${contributorHistory.reputationTier}

Return JSON:
{
  "riskScore": <0-100>,
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "factors": [{"factor": "...", "impact": <-50 to 50>, "description": "..."}],
  "recommendation": "<actionable recommendation>"
}`;

    return this.ai.chatJson<ExecutionRiskAssessment>([
      { role: 'system', content: 'You are a risk assessment expert. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ]);
  }

  async generateRepoSummary(
    repoName: string,
    description: string,
    techStack: string[],
    stats: Record<string, unknown>,
  ): Promise<string> {
    const prompt = `Write a concise 2-3 sentence technical summary of this OSS repository for a developer bounty platform.

Repository: ${repoName}
Description: ${description}
Tech Stack: ${techStack.join(', ')}
Stats: ${JSON.stringify(stats)}

Be specific, technical, and highlight what makes this repo interesting for contributors.`;

    return this.ai.chat([
      { role: 'system', content: 'You are a technical writer for developer platforms.' },
      { role: 'user', content: prompt },
    ]);
  }
}
