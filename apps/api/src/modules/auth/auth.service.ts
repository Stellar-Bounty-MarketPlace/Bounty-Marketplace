import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@bounty/database';
import type { JwtPayload, AuthTokens } from '@bounty/shared';

import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

export interface GitHubProfile {
  id: string;
  username: string;
  displayName: string;
  emails: Array<{ value: string }>;
  photos: Array<{ value: string }>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService,
    private redis: RedisService,
  ) {}

  async validateOrCreateGitHubUser(profile: GitHubProfile) {
    const email = profile.emails[0]?.value ?? `${profile.username}@github.local`;
    const avatarUrl = profile.photos[0]?.value ?? '';

    let user = await this.db.user.findUnique({
      where: { githubId: profile.id },
      include: { contributor: true },
    });

    if (!user) {
      user = await this.db.user.create({
        data: {
          email,
          githubId: profile.id,
          githubUsername: profile.username,
          displayName: profile.displayName || profile.username,
          avatarUrl,
          role: UserRole.CONTRIBUTOR,
          isVerified: true,
          contributor: {
            create: {
              githubUsername: profile.username,
            },
          },
        },
        include: { contributor: true },
      });

      this.logger.log(`New user registered: ${user.githubUsername}`);
    } else {
      // Update profile info on each login
      user = await this.db.user.update({
        where: { id: user.id },
        data: {
          displayName: profile.displayName || profile.username,
          avatarUrl,
        },
        include: { contributor: true },
      });
    }

    return user;
  }

  async generateTokens(userId: string): Promise<AuthTokens> {
    const user = await this.db.user.findUniqueOrThrow({ where: { id: userId } });

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      role: user.role as unknown as import('@bounty/shared').UserRole,
      githubUsername: user.githubUsername,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        expiresIn: this.config.get('JWT_EXPIRES_IN', '15m'),
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    // Store refresh token in Redis
    await this.redis.setJson(`refresh:${userId}`, { token: refreshToken }, 7 * 24 * 3600);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });

      const stored = await this.redis.getJson<{ token: string }>(`refresh:${payload.sub}`);
      if (!stored || stored.token !== refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(payload.sub);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async revokeTokens(userId: string): Promise<void> {
    await this.redis.del(`refresh:${userId}`);
  }

  async validateUser(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      include: { contributor: true },
    });
  }
}
