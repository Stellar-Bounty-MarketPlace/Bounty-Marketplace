import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private db: DatabaseService,
    private redis: RedisService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Health check' })
  async check() {
    const [dbOk, redisOk] = await Promise.allSettled([
      this.db.$queryRaw`SELECT 1`,
      this.redis.get('health:ping'),
    ]);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: dbOk.status === 'fulfilled' ? 'healthy' : 'unhealthy',
        redis: redisOk.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      },
    };
  }
}
