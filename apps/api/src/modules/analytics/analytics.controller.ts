import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('ecosystem')
  @Public()
  @ApiOperation({ summary: 'Get ecosystem-wide metrics' })
  ecosystem() {
    return this.analyticsService.getEcosystemMetrics();
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Get bounty creation time series' })
  timeseries(@Query('days') days?: number) {
    return this.analyticsService.getBountyTimeSeries(days);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get live activity feed' })
  activity(@Query('limit') limit?: number) {
    return this.analyticsService.getActivityFeed(limit);
  }
}
