export const REPUTATION_TIERS = {
  NEWCOMER: { min: 0, max: 99, label: 'Newcomer', color: '#6b7280' },
  CONTRIBUTOR: { min: 100, max: 499, label: 'Contributor', color: '#3b82f6' },
  TRUSTED: { min: 500, max: 1499, label: 'Trusted', color: '#8b5cf6' },
  EXPERT: { min: 1500, max: 4999, label: 'Expert', color: '#f59e0b' },
  ELITE: { min: 5000, max: Infinity, label: 'Elite', color: '#10b981' },
} as const;

export const REPUTATION_WEIGHTS = {
  BOUNTY_COMPLETED: 50,
  BOUNTY_FAILED: -20,
  PR_MERGED: 10,
  PR_REJECTED: -5,
  DISPUTE_WON: 15,
  DISPUTE_LOST: -25,
  MAINTAINER_RATING_5: 20,
  MAINTAINER_RATING_4: 10,
  MAINTAINER_RATING_3: 0,
  MAINTAINER_RATING_2: -10,
  MAINTAINER_RATING_1: -20,
  EARLY_DELIVERY: 5,
  LATE_DELIVERY: -10,
  SPAM_DETECTED: -50,
} as const;

export const BOUNTY_PLATFORM_FEE_BPS = 250; // 2.5%
export const DISPUTE_WINDOW_DAYS = 7;
export const BOUNTY_EXPIRY_DEFAULT_DAYS = 30;
export const MAX_MILESTONES_PER_BOUNTY = 10;
export const MIN_BOUNTY_AMOUNT_USD = 10;

export const SUPPORTED_CURRENCIES = ['XLM', 'USDC'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const AI_MATCH_LIMIT = 10;
export const EMBEDDING_DIMENSIONS = 1536;

export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,      // 5 minutes
  LONG: 3600,       // 1 hour
  DAY: 86400,       // 24 hours
} as const;
