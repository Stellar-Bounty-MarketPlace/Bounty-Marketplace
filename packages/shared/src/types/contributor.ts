export interface ContributorProfile {
  id: string;
  userId: string;
  githubUsername: string;
  githubId: string;
  displayName: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  skills: string[];
  languages: LanguageProficiency[];
  reputationScore: number;
  reputationTier: ReputationTier;
  totalEarned: number;
  bountiesCompleted: number;
  bountiesAttempted: number;
  successRate: number;
  avgDeliveryDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageProficiency {
  language: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  linesOfCode: number;
  repoCount: number;
}

export enum ReputationTier {
  NEWCOMER = 'NEWCOMER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  TRUSTED = 'TRUSTED',
  EXPERT = 'EXPERT',
  ELITE = 'ELITE',
}

export interface ReputationEvent {
  id: string;
  contributorId: string;
  type: ReputationEventType;
  delta: number;
  reason: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export enum ReputationEventType {
  BOUNTY_COMPLETED = 'BOUNTY_COMPLETED',
  BOUNTY_FAILED = 'BOUNTY_FAILED',
  PR_MERGED = 'PR_MERGED',
  PR_REJECTED = 'PR_REJECTED',
  DISPUTE_WON = 'DISPUTE_WON',
  DISPUTE_LOST = 'DISPUTE_LOST',
  MAINTAINER_RATING = 'MAINTAINER_RATING',
  EARLY_DELIVERY = 'EARLY_DELIVERY',
  LATE_DELIVERY = 'LATE_DELIVERY',
  SPAM_DETECTED = 'SPAM_DETECTED',
}

export interface ContributorMatch {
  contributor: ContributorProfile;
  fitScore: number;
  confidenceScore: number;
  matchReasons: string[];
  riskFactors: string[];
  estimatedDeliveryDays: number;
  relevantExperience: RelevantExperience[];
}

export interface RelevantExperience {
  type: 'LANGUAGE' | 'REPO' | 'CATEGORY' | 'SIMILAR_BOUNTY';
  description: string;
  weight: number;
}
