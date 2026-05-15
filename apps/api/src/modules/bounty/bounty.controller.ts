import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@bounty/database';
import type { BountyFilter } from '@bounty/shared';

import { BountyService } from './bounty.service';
import { CreateBountyDto } from './dto/create-bounty.dto';
import { AssignBountyDto } from './dto/assign-bounty.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('bounties')
@Controller('bounties')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BountyController {
  constructor(private bountyService: BountyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bounty' })
  create(
    @Body() dto: CreateBountyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bountyService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List bounties with filters' })
  findAll(@Query() filter: BountyFilter) {
    return this.bountyService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bounty by ID' })
  findOne(@Param('id') id: string) {
    return this.bountyService.findById(id);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign a contributor to a bounty' })
  assign(
    @Param('id') bountyId: string,
    @Body() dto: AssignBountyDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bountyService.assign(bountyId, dto.contributorId, userId);
  }

  @Patch(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit bounty for review' })
  submit(
    @Param('id') bountyId: string,
    @CurrentUser() user: { id: string; contributor: { id: string } },
  ) {
    return this.bountyService.submitForReview(bountyId, user.contributor.id);
  }

  @Patch(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve bounty completion' })
  approve(
    @Param('id') bountyId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bountyService.approve(bountyId, userId);
  }

  @Patch(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a bounty' })
  cancel(
    @Param('id') bountyId: string,
    @CurrentUser() user: { id: string; role: UserRole },
  ) {
    return this.bountyService.cancel(bountyId, user.id, user.role);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Open a dispute on a bounty' })
  dispute(
    @Param('id') bountyId: string,
    @Body() dto: OpenDisputeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.bountyService.openDispute(bountyId, userId, dto.reason, dto.evidence);
  }
}
