import { Injectable, Logger } from '@nestjs/common';
import { NotificationType } from '@bounty/database';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';

interface SendNotificationDto {
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private db: DatabaseService,
    private redis: RedisService,
  ) {}

  async send(userId: string, dto: SendNotificationDto) {
    const notification = await this.db.notification.create({
      data: {
        userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        metadata: dto.metadata ?? {},
      },
    });

    // Publish to Redis for WebSocket delivery
    await this.redis.publish(
      `notifications:${userId}`,
      JSON.stringify(notification),
    );

    return notification;
  }

  async getUnread(userId: string) {
    return this.db.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(notificationId: string, userId: string) {
    return this.db.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllRead(userId: string) {
    return this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
