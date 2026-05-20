import {
  WebSocketGateway, WebSocketServer, OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class EventsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket Gateway initialized');
  }

  emitNewActivity(activity: any) {
    this.server.emit('new_activity', activity);
  }

  emitAchievementUnlocked(userId: string, achievement: any) {
    this.server.emit('achievement_unlocked', { userId, achievement });
  }
}
