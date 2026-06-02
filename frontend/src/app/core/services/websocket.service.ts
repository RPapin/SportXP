import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket;

  newActivity$ = new Subject<any>();
  achievementUnlocked$ = new Subject<any>();
  syncStart$ = new Subject<{ userId: string; total: number }>();
  syncProgress$ = new Subject<{ userId: string; imported: number; total: number }>();
  syncDone$ = new Subject<{ userId: string; imported: number; skipped: number; remaining: number }>();

  constructor() {
    this.socket = io(environment.wsUrl, { transports: ['websocket'] });

    this.socket.on('new_activity', (data) => this.newActivity$.next(data));
    this.socket.on('achievement_unlocked', (data) => this.achievementUnlocked$.next(data));
    this.socket.on('sync:start', (data) => this.syncStart$.next(data));
    this.socket.on('sync:progress', (data) => this.syncProgress$.next(data));
    this.socket.on('sync:done', (data) => this.syncDone$.next(data));
  }

  disconnect() {
    this.socket.disconnect();
  }
}
