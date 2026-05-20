import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private socket: Socket;
  newActivity$ = new Subject<any>();
  achievementUnlocked$ = new Subject<any>();

  constructor() {
    this.socket = io(environment.wsUrl, { transports: ['websocket'] });

    this.socket.on('new_activity', (data) => this.newActivity$.next(data));
    this.socket.on('achievement_unlocked', (data) => this.achievementUnlocked$.next(data));
  }

  disconnect() {
    this.socket.disconnect();
  }
}
