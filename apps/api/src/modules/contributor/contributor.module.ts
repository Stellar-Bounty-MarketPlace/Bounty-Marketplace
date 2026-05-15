import { Module } from '@nestjs/common';
import { ContributorService } from './contributor.service';
import { ContributorController } from './contributor.controller';
import { PrVerificationModule } from '../pr-verification/pr-verification.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrVerificationModule, AiModule],
  controllers: [ContributorController],
  providers: [ContributorService],
  exports: [ContributorService],
})
export class ContributorModule {}
