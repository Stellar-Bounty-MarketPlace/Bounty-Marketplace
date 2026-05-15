import { Controller, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { PrVerificationService } from './pr-verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class LinkPRDto {
  @ApiProperty() @IsString() bountyId!: string;
  @ApiProperty() @IsUrl() prUrl!: string;
}

@ApiTags('pr-verification')
@Controller('prs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PrVerificationController {
  constructor(private prVerification: PrVerificationService) {}

  @Post('link')
  @ApiOperation({ summary: 'Link and verify a GitHub PR to a bounty' })
  linkPR(
    @Body() dto: LinkPRDto,
    @CurrentUser() user: { contributor: { id: string } },
  ) {
    return this.prVerification.linkAndVerifyPR({
      bountyId: dto.bountyId,
      prUrl: dto.prUrl,
      contributorId: user.contributor.id,
    });
  }

  @Patch(':id/sync')
  @ApiOperation({ summary: 'Sync PR status from GitHub' })
  syncStatus(@Param('id') prId: string) {
    return this.prVerification.syncPRStatus(prId);
  }
}
