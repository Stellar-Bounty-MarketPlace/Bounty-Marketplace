import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsInt, Min, Max, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ReputationService } from './reputation.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class RateContributorDto {
  @ApiProperty() @IsString() bountyId!: string;
  @ApiProperty() @IsString() contributorId!: string;
  @ApiProperty() @IsInt() @Min(1) @Max(5) score!: number;
}

@ApiTags('reputation')
@Controller('reputation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReputationController {
  constructor(private reputationService: ReputationService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get contributor reputation leaderboard' })
  leaderboard(@Query('limit') limit?: number) {
    return this.reputationService.getLeaderboard(limit);
  }

  @Post('rate')
  @ApiOperation({ summary: 'Rate a contributor after bounty completion' })
  rate(@Body() dto: RateContributorDto, @CurrentUser('id') userId: string) {
    return this.reputationService.applyMaintainerRating(
      dto.contributorId,
      dto.bountyId,
      userId,
      dto.score,
    );
  }
}
