import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { EscrowService } from './escrow.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class FundBountyDto {
  @ApiProperty() @IsString() walletAddress!: string;
}

@ApiTags('escrow')
@Controller('escrow')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EscrowController {
  constructor(private escrowService: EscrowService) {}

  @Post(':bountyId/fund')
  @ApiOperation({ summary: 'Fund a bounty escrow on-chain' })
  fund(@Param('bountyId') bountyId: string, @Body() dto: FundBountyDto) {
    return this.escrowService.fundBounty(bountyId, dto.walletAddress);
  }

  @Post(':bountyId/release')
  @ApiOperation({ summary: 'Release payout to contributor' })
  release(@Param('bountyId') bountyId: string) {
    return this.escrowService.releasePayout(bountyId);
  }

  @Get(':bountyId/state')
  @ApiOperation({ summary: 'Get escrow state for a bounty' })
  state(@Param('bountyId') bountyId: string) {
    return this.escrowService.getEscrowState(bountyId);
  }
}
