export enum BountyStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum BountyDifficulty {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  EXPERT = 'EXPERT',
}

export enum BountyCategory {
  BUG_FIX = 'BUG_FIX',
  FEATURE = 'FEATURE',
  DOCUMENTATION = 'DOCUMENTATION',
  SECURITY = 'SECURITY',
  PERFORMANCE = 'PERFORMANCE',
  TESTING = 'TESTING',
  REFACTOR = 'REFACTOR',
  DESIGN = 'DESIGN',
  DEVOPS = 'DEVOPS',
  OTHER = 'OTHER',
}

export interface BountyMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  dueDate?: string;
  completedAt?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  status: BountyStatus;
  difficulty: BountyDifficulty;
  category: BountyCategory;
  amount: number;
  currency: string;
  repositoryId: string;
  issueNumber?: number;
  issueUrl?: string;
  creatorId: string;
  assigneeId?: string;
  milestones: BountyMilestone[];
  tags: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  onchainId?: string;
  escrowAddress?: string;
}

export interface CreateBountyDto {
  title: string;
  description: string;
  difficulty: BountyDifficulty;
  category: BountyCategory;
  amount: number;
  currency: string;
  repositoryId: string;
  issueNumber?: number;
  issueUrl?: string;
  milestones?: Omit<BountyMilestone, 'id' | 'completedAt' | 'status'>[];
  tags?: string[];
  expiresAt?: string;
}

export interface BountyFilter {
  status?: BountyStatus[];
  difficulty?: BountyDifficulty[];
  category?: BountyCategory[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  repositoryId?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'amount' | 'createdAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
}
