import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

import { AuthService, type GitHubProfile } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.get<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: config.get<string>('GITHUB_CALLBACK_URL'),
      scope: ['user:email', 'read:user'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: GitHubProfile,
    done: (err: Error | null, user: unknown) => void,
  ) {
    try {
      const user = await this.authService.validateOrCreateGitHubUser(profile);
      done(null, user);
    } catch (err) {
      done(err as Error, null);
    }
  }
}
