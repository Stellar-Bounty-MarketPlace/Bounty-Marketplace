import { Module } from '@nestjs/common';
import { BountyController } from './bounty.controller';
import { BountyService } from './bounty.service';
import { BountyResolver } from './bounty.resolver';
import { EscrowModule } from '../escrow/escrow.module';
import { AiModule } from '../ai/ai.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [EscrowModule, AiModule, NotificationModule],
  controllers: [BountyController],
  providers: [BountyService, BountyResolver],
  exports: [BountyService],
})
export class BountyModule {}
