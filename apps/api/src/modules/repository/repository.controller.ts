import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { RepositoryService } from './repository.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

class ImportRepoDto {
  @ApiProperty({ example: 'stellar/soroban-examples' })
  @IsString()
  fullName!: string;
}

@ApiTags('repositories')
@Controller('repositories')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RepositoryController {
  constructor(private repositoryService: RepositoryService) {}

  @Get()
  @ApiOperation({ summary: 'List all repositories' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.repositoryService.findAll(page, limit);
  }

  @Get(':owner/:repo')
  @ApiOperation({ summary: 'Get repository by full name' })
  findOne(@Param('owner') owner: string, @Param('repo') repo: string) {
    return this.repositoryService.findByFullName(`${owner}/${repo}`);
  }

  @Post('import')
  @ApiOperation({ summary: 'Import a GitHub repository' })
  import(@Body() dto: ImportRepoDto, @CurrentUser('id') userId: string) {
    return this.repositoryService.importFromGitHub(dto.fullName, userId);
  }

  @Post(':id/analyze')
  @ApiOperation({ summary: 'Trigger AI analysis of a repository' })
  analyze(@Param('id') id: string) {
    return this.repositoryService.analyzeRepository(id);
  }
}
