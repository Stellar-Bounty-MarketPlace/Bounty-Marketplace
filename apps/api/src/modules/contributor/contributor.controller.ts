import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { ContributorService } from './contributor.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class UpdateWalletDto {
  @ApiProperty() @IsString() walletAddress!: string;
}

@ApiTags('contributors')
@Controller('contributors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ContributorController {
  constructor(private contributorService: ContributorService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search contributors' })
  search(@Query('q') query: string) {
    return this.contributorService.search(query);
  }

  @Get(':username')
  @ApiOperation({ summary: 'Get contributor profile by GitHub username' })
  findByUsername(@Param('username') username: string) {
    return this.contributorService.findByUsername(username);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync contributor profile from GitHub' })
  sync(@Param('id') id: string) {
    return this.contributorService.syncFromGitHub(id);
  }

  @Patch('wallet')
  @ApiOperation({ summary: 'Update contributor wallet address' })
  updateWallet(@Body() dto: UpdateWalletDto, @CurrentUser('id') userId: string) {
    return this.contributorService.updateWallet(userId, dto.walletAddress);
  }
}
