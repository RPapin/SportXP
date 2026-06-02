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

  emitSyncStart(userId: string, total: number) {
    this.server.emit('sync:start', { userId, total });
  }

  emitSyncProgress(userId: string, imported: number, total: number) {
    this.server.emit('sync:progress', { userId, imported, total });
  }

  emitSyncDone(userId: string, imported: number, skipped: number, remaining: number) {
    this.server.emit('sync:done', { userId, imported, skipped, remaining });
  }
}
