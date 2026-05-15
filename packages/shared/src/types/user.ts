export enum UserRole {
  CONTRIBUTOR = 'CONTRIBUTOR',
  MAINTAINER = 'MAINTAINER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  githubId: string;
  githubUsername: string;
  displayName: string;
  avatarUrl: string;
  role: UserRole;
  isVerified: boolean;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  githubUsername: string;
  iat: number;
  exp: number;
}
