import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { EmbeddingService } from './embedding.service';
import { MatchingEngine } from './matching.engine';
import { ClassificationService } from './classification.service';
import { SpamDetectionService } from './spam-detection.service';
import { AiController } from './ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService, EmbeddingService, MatchingEngine, ClassificationService, SpamDetectionService],
  exports: [AiService, EmbeddingService, MatchingEngine, ClassificationService, SpamDetectionService],
})
export class AiModule {}
