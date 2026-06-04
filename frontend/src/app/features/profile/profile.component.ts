import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { SyncProgressService } from '../../core/services/sync-progress.service';
import { getLevelFromXP, getProgressPercent, getXPForLevel } from '../../shared/pipes/xp-level.pipe';
import { environment } from '../../../environments/environment';

const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_activity:   '🏁',
  distance_100:     '🏆',
  distance_500:     '🌟',
  streak_7:         '🔥',
  streak_30:        '💪',
  explorer:         '🗺️',
  speed_demon:      '⚡',
  mountain_goat:    '⛰️',
};

const SPORT_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '🏔️', Ride: '🚴',
  MountainBikeRide: '🚵', GravelRide: '🚴',
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DecimalPipe, MatSnackBarModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  activities = signal<any[]>([]);
  userAchievements = signal<any[]>([]);
  syncing = signal(false);
  stravaEligibleCount = signal<number | null>(null);

  isImportIncomplete = computed(() => {
    const total = this.stravaEligibleCount();
    return total !== null && total > this.activities().length;
  });

  constructor(
    public auth: AuthService,
    public syncProgress: SyncProgressService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadActivities();
    this.loadAchievements();
    this.loadSyncStatus();
  }

  private loadSyncStatus() {
    this.http.get<{ canSync: boolean; secondsUntilSync: number; stravaEligibleCount: number | null }>(
      `${environment.apiUrl}/api/activities/sync-status`,
    ).subscribe({
      next: ({ secondsUntilSync, stravaEligibleCount }) => {
        this.syncProgress.initCooldown(secondsUntilSync);
        this.stravaEligibleCount.set(stravaEligibleCount ?? null);
      },
    });
  }

  level(xp: number): number   { return getLevelFromXP(xp ?? 0); }
  progress(xp: number): number { return getProgressPercent(xp ?? 0); }
  nextXP(xp: number): number  { return getXPForLevel(getLevelFromXP(xp ?? 0) + 1); }

  totalKm(): number {
    return this.activities().reduce((s, a) => s + (a.distanceM ?? 0), 0) / 1000;
  }

  achievementIcon(name: string): string {
    const key = name?.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return ACHIEVEMENT_ICONS[key] ?? '🏅';
  }

  sportIcon(type: string): string {
    return SPORT_ICONS[type] ?? '⚡';
  }

  syncActivities() {
    if (!this.syncProgress.canSync()) return;
    this.syncing.set(true);
    this.http.post<{ imported: number; skipped: number; remaining: number }>(
      `${environment.apiUrl}/api/activities/sync-all`, {},
    ).subscribe({
      next: (result) => {
        this.syncing.set(false);
        this.loadActivities();
        this.loadSyncStatus();
        if (result.remaining > 0) {
          this.snackBar.open(
            `${result.imported} importée(s) · ${result.remaining} restante(s) — sync à nouveau dans 15 min`,
            '✕',
            { duration: 6000 },
          );
        }
      },
      error: (err) => {
        this.syncing.set(false);
        if (err.status === 429) {
          const secs: number = err.error?.secondsUntilSync ?? 900;
          this.syncProgress.initCooldown(secs);
          this.snackBar.open(
            `Limite atteinte — sync disponible dans ${this.syncProgress.formatCooldown(secs)}`,
            '✕',
            { duration: 4000 },
          );
        } else {
          this.snackBar.open('Erreur lors de la synchronisation', '✕', { duration: 3000 });
        }
      },
    });
  }

  private loadActivities() {
    this.http.get<any[]>(`${environment.apiUrl}/api/activities/mine`).subscribe({
      next: (data) => this.activities.set(data),
    });
  }

  private loadAchievements() {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;
    this.http.get<any>(`${environment.apiUrl}/api/users/${userId}`).subscribe({
      next: (profile) => this.userAchievements.set(profile.achievements ?? []),
    });
  }
}
