import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(EventsGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> socketIds

  constructor(private jwt: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth['token'] as string;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<{ sub: string }>(token);
      client.data['userId'] = payload.sub;

      const existing = this.userSockets.get(payload.sub) ?? [];
      this.userSockets.set(payload.sub, [...existing, client.id]);

      this.logger.debug(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data['userId'] as string;
    if (userId) {
      const sockets = this.userSockets.get(userId) ?? [];
      this.userSockets.set(
        userId,
        sockets.filter((id) => id !== client.id),
      );
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:bounty')
  handleSubscribeBounty(
    @ConnectedSocket() client: Socket,
    @MessageBody() bountyId: string,
  ) {
    client.join(`bounty:${bountyId}`);
    return { event: 'subscribed', data: { bountyId } };
  }

  @SubscribeMessage('subscribe:activity')
  handleSubscribeActivity(@ConnectedSocket() client: Socket) {
    client.join('activity:global');
    return { event: 'subscribed', data: { channel: 'activity' } };
  }

  emitToUser(userId: string, event: string, data: unknown) {
    const socketIds = this.userSockets.get(userId) ?? [];
    socketIds.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }

  emitToBountyRoom(bountyId: string, event: string, data: unknown) {
    this.server.to(`bounty:${bountyId}`).emit(event, data);
  }

  emitToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }

  broadcastActivity(activity: unknown) {
    this.server.to('activity:global').emit('activity:new', activity);
  }
}
