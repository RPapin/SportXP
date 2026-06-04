import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { SyncProgressService } from './sync-progress.service';
import { WebsocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class AutoSyncService {
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private syncProgress: SyncProgressService,
    ws: WebsocketService,
  ) {
    ws.syncDone$.subscribe(({ userId, remaining }) => {
      if (userId !== this.auth.currentUser()?.id) return;
      if (remaining > 0) {
        this.scheduleRetry();
      } else {
        this.cancelRetry();
      }
    });
  }

  async checkAndSync(): Promise<void> {
    if (!this.auth.isLoggedIn()) return;
    try {
      const status = await firstValueFrom(
        this.http.get<{ secondsUntilSync: number; stravaEligibleCount: number | null }>(
          `${environment.apiUrl}/api/activities/sync-status`,
        ),
      );
      this.syncProgress.initCooldown(status.secondsUntilSync);
      if (status.secondsUntilSync === 0) {
        this.triggerSync();
      }
    } catch { /* fail silently, sync is best-effort */ }
  }

  private triggerSync() {
    if (!this.syncProgress.canSync()) return;
    this.http.post(`${environment.apiUrl}/api/activities/sync-all`, {}).subscribe({
      error: () => {},
    });
  }

  private scheduleRetry() {
    this.cancelRetry();
    // 15 min + 2s buffer so the cooldown has fully expired
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.triggerSync();
    }, 15 * 60 * 1000 + 2000);
  }

  private cancelRetry() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }
}
