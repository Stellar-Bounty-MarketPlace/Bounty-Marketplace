export interface AIMatchRequest {
  bountyId: string;
  limit?: number;
  excludeContributorIds?: string[];
}

export interface AIMatchResponse {
  bountyId: string;
  matches: import('./contributor').ContributorMatch[];
  modelVersion: string;
  computedAt: string;
}

export interface IssueClassification {
  category: string;
  difficulty: string;
  estimatedHours: number;
  requiredSkills: string[];
  confidence: number;
  reasoning: string;
}

export interface SpamDetectionResult {
  isSpam: boolean;
  confidence: number;
  signals: SpamSignal[];
}

export interface SpamSignal {
  type: string;
  description: string;
  weight: number;
}

export interface ExecutionRiskAssessment {
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: RiskFactor[];
  recommendation: string;
}

export interface RiskFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface EmbeddingVector {
  id: string;
  vector: number[];
  metadata: Record<string, unknown>;
}
