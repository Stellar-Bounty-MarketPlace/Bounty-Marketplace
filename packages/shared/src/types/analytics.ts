export interface EcosystemMetrics {
  totalBounties: number;
  activeBounties: number;
  completedBounties: number;
  totalValueLocked: number;
  totalPaidOut: number;
  uniqueContributors: number;
  uniqueRepositories: number;
  avgBountyValue: number;
  avgCompletionDays: number;
  successRate: number;
  period: MetricsPeriod;
}

export interface MetricsPeriod {
  start: string;
  end: string;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface BountyFlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface FlowNode {
  id: string;
  type: 'repository' | 'contributor' | 'bounty';
  label: string;
  value: number;
  metadata: Record<string, unknown>;
}

export interface FlowEdge {
  source: string;
  target: string;
  value: number;
  label?: string;
}

export interface ContributorRankEntry {
  rank: number;
  contributor: {
    id: string;
    githubUsername: string;
    displayName: string;
    avatarUrl: string;
    reputationTier: string;
  };
  reputationScore: number;
  bountiesCompleted: number;
  totalEarned: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  trendDelta: number;
}

export interface ActivityFeedItem {
  id: string;
  type: ActivityType;
  actor: {
    id: string;
    displayName: string;
    avatarUrl: string;
    githubUsername: string;
  };
  subject: {
    id: string;
    title: string;
    type: string;
  };
  metadata: Record<string, unknown>;
  createdAt: string;
}

export enum ActivityType {
  BOUNTY_CREATED = 'BOUNTY_CREATED',
  BOUNTY_FUNDED = 'BOUNTY_FUNDED',
  BOUNTY_ASSIGNED = 'BOUNTY_ASSIGNED',
  BOUNTY_COMPLETED = 'BOUNTY_COMPLETED',
  PR_SUBMITTED = 'PR_SUBMITTED',
  PR_MERGED = 'PR_MERGED',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  REPUTATION_MILESTONE = 'REPUTATION_MILESTONE',
  PAYOUT_RELEASED = 'PAYOUT_RELEASED',
}
