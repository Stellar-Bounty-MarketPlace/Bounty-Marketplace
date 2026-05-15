import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { AuthModule } from './modules/auth/auth.module';
import { BountyModule } from './modules/bounty/bounty.module';
import { ContributorModule } from './modules/contributor/contributor.module';
import { RepositoryModule } from './modules/repository/repository.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ReputationModule } from './modules/reputation/reputation.module';
import { PrVerificationModule } from './modules/pr-verification/pr-verification.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { HealthModule } from './modules/health/health.module';
import { GatewayModule } from './modules/gateway/gateway.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
      { name: 'long', ttl: 60000, limit: 200 },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
      subscriptions: {
        'graphql-ws': true,
      },
    }),

    // Infrastructure
    DatabaseModule,
    RedisModule,
    GatewayModule,

    // Domain modules
    AuthModule,
    BountyModule,
    ContributorModule,
    RepositoryModule,
    AnalyticsModule,
    AiModule,
    NotificationModule,
    ReputationModule,
    PrVerificationModule,
    EscrowModule,
    HealthModule,
  ],
})
export class AppModule {}
