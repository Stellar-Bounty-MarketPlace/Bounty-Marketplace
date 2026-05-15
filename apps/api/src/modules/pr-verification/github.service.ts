import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { type AxiosInstance } from 'axios';

export interface GitHubPR {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  merged: boolean;
  merged_at: string | null;
  commits: number;
  additions: number;
  deletions: number;
  changed_files: number;
  user: { login: string; id: number };
  head: { sha: string; ref: string };
  base: { sha: string; ref: string; repo: { full_name: string } };
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { name: string; email: string; date: string };
  };
  author: { login: string } | null;
}

export interface GitHubUser {
  login: string;
  id: number;
  name: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  contributions?: number;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private http: AxiosInstance;

  constructor(private config: ConfigService) {
    this.http = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${config.get('GITHUB_APP_TOKEN')}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      timeout: 10000,
    });
  }

  async getPullRequest(owner: string, repo: string, prNumber: number): Promise<GitHubPR> {
    const { data } = await this.http.get<GitHubPR>(`/repos/${owner}/${repo}/pulls/${prNumber}`);
    return data;
  }

  async getPRCommits(owner: string, repo: string, prNumber: number): Promise<GitHubCommit[]> {
    const { data } = await this.http.get<GitHubCommit[]>(
      `/repos/${owner}/${repo}/pulls/${prNumber}/commits`,
    );
    return data;
  }

  async getUser(username: string): Promise<GitHubUser> {
    const { data } = await this.http.get<GitHubUser>(`/users/${username}`);
    return data;
  }

  async getUserContributions(username: string): Promise<{
    totalCommits: number;
    totalPRs: number;
    mergedPRs: number;
    languages: Record<string, number>;
  }> {
    // Use GitHub search API to get contribution stats
    const [prsOpen, prsMerged] = await Promise.all([
      this.http.get<{ total_count: number }>(`/search/issues?q=author:${username}+type:pr+state:open`),
      this.http.get<{ total_count: number }>(`/search/issues?q=author:${username}+type:pr+is:merged`),
    ]);

    return {
      totalCommits: 0, // Would require GraphQL API for accurate count
      totalPRs: prsOpen.data.total_count + prsMerged.data.total_count,
      mergedPRs: prsMerged.data.total_count,
      languages: {},
    };
  }

  async syncContributorProfile(username: string) {
    const [user, contributions] = await Promise.all([
      this.getUser(username),
      this.getUserContributions(username),
    ]);

    return {
      githubId: String(user.id),
      displayName: user.name || username,
      githubStats: {
        publicRepos: user.public_repos,
        followers: user.followers,
        totalPRs: contributions.totalPRs,
        mergedPRs: contributions.mergedPRs,
        accountAge: Math.floor(
          (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365),
        ),
      },
    };
  }
}
