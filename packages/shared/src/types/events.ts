// Domain events for event-driven architecture

export enum DomainEventType {
  // Bounty events
  BOUNTY_CREATED = 'bounty.created',
  BOUNTY_FUNDED = 'bounty.funded',
  BOUNTY_ASSIGNED = 'bounty.assigned',
  BOUNTY_SUBMITTED = 'bounty.submitted',
  BOUNTY_APPROVED = 'bounty.approved',
  BOUNTY_REJECTED = 'bounty.rejected',
  BOUNTY_COMPLETED = 'bounty.completed',
  BOUNTY_CANCELLED = 'bounty.cancelled',
  BOUNTY_EXPIRED = 'bounty.expired',
  BOUNTY_DISPUTED = 'bounty.disputed',

  // PR events
  PR_LINKED = 'pr.linked',
  PR_VERIFIED = 'pr.verified',
  PR_MERGED = 'pr.merged',
  PR_CLOSED = 'pr.closed',
  PR_SPAM_DETECTED = 'pr.spam_detected',

  // Reputation events
  REPUTATION_UPDATED = 'reputation.updated',
  REPUTATION_TIER_CHANGED = 'reputation.tier_changed',

  // Payout events
  PAYOUT_INITIATED = 'payout.initiated',
  PAYOUT_COMPLETED = 'payout.completed',
  PAYOUT_FAILED = 'payout.failed',

  // AI events
  MATCH_COMPUTED = 'ai.match_computed',
  CLASSIFICATION_COMPLETED = 'ai.classification_completed',
}

export interface DomainEvent<T = unknown> {
  id: string;
  type: DomainEventType;
  aggregateId: string;
  aggregateType: string;
  payload: T;
  metadata: {
    userId?: string;
    correlationId: string;
    causationId?: string;
    timestamp: string;
    version: number;
  };
}

export interface BountyCreatedPayload {
  bountyId: string;
  creatorId: string;
  repositoryId: string;
  amount: number;
  currency: string;
}

export interface BountyAssignedPayload {
  bountyId: string;
  contributorId: string;
  assignedBy: string;
}

export interface PayoutCompletedPayload {
  bountyId: string;
  contributorId: string;
  amount: number;
  currency: string;
  txHash: string;
}
