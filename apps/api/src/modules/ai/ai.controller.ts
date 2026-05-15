import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MatchingEngine } from './matching.engine';
import { ClassificationService } from './classification.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

class ClassifyIssueDto {
  @ApiProperty() @IsString() title!: string;
  @ApiProperty() @IsString() body!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() repoContext?: string;
}

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(
    private matchingEngine: MatchingEngine,
    private classification: ClassificationService,
  ) {}

  @Get('matches/:bountyId')
  @ApiOperation({ summary: 'Get AI-computed contributor matches for a bounty' })
  getMatches(@Param('bountyId') bountyId: string) {
    return this.matchingEngine.computeMatches(bountyId);
  }

  @Post('classify')
  @ApiOperation({ summary: 'Classify a GitHub issue' })
  classifyIssue(@Body() dto: ClassifyIssueDto) {
    return this.classification.classifyIssue(dto.title, dto.body, dto.repoContext);
  }
}
