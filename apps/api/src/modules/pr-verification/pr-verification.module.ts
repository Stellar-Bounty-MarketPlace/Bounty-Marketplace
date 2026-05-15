import { Module } from '@nestjs/common';
import { PrVerificationService } from './pr-verification.service';
import { GitHubService } from './github.service';
import { PrVerificationController } from './pr-verification.controller';
import { AiModule } from '../ai/ai.module';
import { ReputationModule } from '../reputation/reputation.module';

@Module({
  imports: [AiModule, ReputationModule],
  controllers: [PrVerificationController],
  providers: [PrVerificationService, GitHubService],
  exports: [PrVerificationService, GitHubService],
})
export class PrVerificationModule {}
