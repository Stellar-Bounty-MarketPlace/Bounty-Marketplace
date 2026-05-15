import { Module } from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { RepositoryController } from './repository.controller';
import { AiModule } from '../ai/ai.module';
import { PrVerificationModule } from '../pr-verification/pr-verification.module';

@Module({
  imports: [AiModule, PrVerificationModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
  exports: [RepositoryService],
})
export class RepositoryModule {}
