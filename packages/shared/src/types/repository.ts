export interface Repository {
  id: string;
  githubId: string;
  fullName: string;
  name: string;
  owner: string;
  description?: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  language?: string;
  languages: Record<string, number>;
  topics: string[];
  isPrivate: boolean;
  maintainerId: string;
  activeBounties: number;
  totalBountyValue: number;
  healthScore: number;
  lastAnalyzedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepositoryIntelligence {
  repositoryId: string;
  codebaseComplexity: number;
  testCoverage?: number;
  documentationScore: number;
  activityScore: number;
  contributorDiversity: number;
  issueResolutionTime: number;
  prMergeTime: number;
  topContributors: string[];
  hotFiles: string[];
  techStack: string[];
  aiSummary: string;
  recommendations: string[];
  analyzedAt: string;
}
