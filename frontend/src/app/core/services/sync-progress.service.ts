import { Injectable, signal, computed } from '@angular/core';
import { WebsocketService } from './websocket.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SyncProgressService {
  readonly isSyncing = signal(false);
  readonly isDone = signal(false);
  readonly imported = signal(0);
  readonly total = signal(0);
  readonly remaining = signal(0);
  readonly cooldownSeconds = signal(0);

  readonly canSync = computed(() => !this.isSyncing() && this.cooldownSeconds() === 0);

  readonly percent = computed(() => {
    const t = this.total();
    return t === 0 ? 100 : Math.round((this.imported() / t) * 100);
  });

  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private cooldownInterval: ReturnType<typeof setInterval> | null = null;

  constructor(ws: WebsocketService, private auth: AuthService) {
    ws.syncStart$.subscribe(({ userId, total }) => {
      if (userId !== this.auth.currentUser()?.id) return;
      if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
      this.imported.set(0);
      this.total.set(total);
      this.remaining.set(0);
      this.isDone.set(false);
      this.isSyncing.set(true);
    });

    ws.syncProgress$.subscribe(({ userId, imported, total }) => {
      if (userId !== this.auth.currentUser()?.id) return;
      this.imported.set(imported);
      this.total.set(total);
    });

    ws.syncDone$.subscribe(({ userId, imported, remaining }) => {
      if (userId !== this.auth.currentUser()?.id) return;
      this.imported.set(imported);
      this.remaining.set(remaining);
      this.isDone.set(true);
      // Start 15-minute cooldown
      this.initCooldown(15 * 60);
      // Keep the bar visible longer when there are remaining activities
      this.hideTimer = setTimeout(() => {
        this.isSyncing.set(false);
        this.isDone.set(false);
        this.hideTimer = null;
      }, remaining > 0 ? 8000 : 3000);
    });
  }

  /** Called on page load (from sync-status endpoint) or on 429 error */
  initCooldown(seconds: number) {
    if (seconds <= 0) {
      this.cooldownSeconds.set(0);
      return;
    }
    this.cooldownSeconds.set(seconds);
    if (this.cooldownInterval) clearInterval(this.cooldownInterval);
    this.cooldownInterval = setInterval(() => {
      const s = this.cooldownSeconds();
      if (s <= 1) {
        this.cooldownSeconds.set(0);
        clearInterval(this.cooldownInterval!);
        this.cooldownInterval = null;
      } else {
        this.cooldownSeconds.set(s - 1);
      }
    }, 1000);
  }

  formatCooldown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
