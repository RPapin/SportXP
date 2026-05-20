import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
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
  template: `
    @if (auth.currentUser(); as user) {
      <div class="profile-page">

        <!-- Gradient Header -->
        <div class="profile-header">
          <img
            class="profile-avatar"
            [src]="user.avatarUrl || 'assets/avatar-default.png'"
            [alt]="user.firstName"
          />
          <h2 class="profile-name">{{ user.firstName }} {{ user.lastName }}</h2>
          @if (user.city || user.country) {
            <p class="profile-location">
              {{ user.city }}{{ user.city && user.country ? ', ' : '' }}{{ user.country }}
            </p>
          }

          <!-- XP Bar -->
          <div class="xp-bar-container">
            <div class="xp-bar-header">
              <div class="level-info">
                <span class="level-text">Niveau {{ level(user.xpTotal) }}</span>
                <span class="level-badge">Athlète</span>
              </div>
              <span class="xp-ratio">{{ user.xpTotal | number }} / {{ nextXP(user.xpTotal) | number }} XP</span>
            </div>
            <div class="xp-track">
              <div class="xp-fill" [style.width.%]="progress(user.xpTotal)"></div>
            </div>
            <p class="xp-remaining">{{ (nextXP(user.xpTotal) - user.xpTotal) | number }} XP jusqu'au niveau {{ level(user.xpTotal) + 1 }}</p>
          </div>
        </div>

        <!-- Stats Cards (overlap header) -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ user.xpTotal | number }}</div>
            <div class="stat-label">XP Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ activities().length }}</div>
            <div class="stat-label">Activités</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ totalKm() | number:'1.0-0' }}</div>
            <div class="stat-label">km parcourus</div>
          </div>
        </div>

        <!-- Sync Button -->
        <div class="sync-section">
          <button class="sync-btn" (click)="syncActivities()" [disabled]="syncing()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 2v6h-6"/>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
              <path d="M3 22v-6h6"/>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
            </svg>
            {{ syncing() ? 'Synchronisation…' : 'Synchroniser mes activités Strava' }}
          </button>
        </div>

        <!-- Achievements -->
        @if (userAchievements().length > 0) {
          <div class="section">
            <div class="section-header">
              <h3 class="section-title">
                <span>🏅</span> Trophées débloqués
              </h3>
            </div>
            <div class="achievements-grid">
              @for (ua of userAchievements(); track ua.id) {
                <div class="achievement-item" [title]="ua.description">
                  <div class="achievement-icon">{{ achievementIcon(ua.name) }}</div>
                  <span class="achievement-name">{{ ua.name }}</span>
                </div>
              }
            </div>
          </div>
        }

        <!-- Recent Activities -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">
              <span>⚡</span> Activités récentes
            </h3>
          </div>
          @for (a of activities(); track a.id) {
            <div class="activity-row">
              <div class="activity-emoji">{{ sportIcon(a.sportType) }}</div>
              <div class="activity-details">
                <div class="activity-name">{{ a.name }}</div>
                <div class="activity-meta">
                  {{ (a.distanceM / 1000) | number:'1.1-1' }} km
                  @if (a.startDate) { · {{ a.startDate | date:'dd MMM yy' }} }
                </div>
              </div>
              <div class="activity-xp">+{{ a.xpEarned | number:'1.0-0' }} XP</div>
            </div>
          }
          @if (activities().length === 0) {
            <p class="no-activities">Aucune activité synchronisée</p>
          }
        </div>

        <!-- Settings / Logout -->
        <div class="section logout-section">
          <button class="logout-btn" (click)="auth.logout()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
            Se déconnecter
          </button>
        </div>

        <div class="page-bottom"></div>
      </div>
    } @else {
      <div class="not-logged">
        <div class="not-logged-icon">👤</div>
        <p>Connecte-toi avec Strava pour voir ton profil</p>
      </div>
    }
  `,
  styles: [`
    .profile-page {
      background: #f9fafb;
      min-height: 100%;
    }

    /* Gradient Header */
    .profile-header {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      padding: 2rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .profile-avatar {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid white;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,.2);
    }

    .profile-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: white;
      margin: 0 0 4px;
    }

    .profile-location {
      color: #bfdbfe;
      margin: 0 0 16px;
      font-size: 0.85rem;
    }

    /* XP Bar */
    .xp-bar-container {
      width: 100%;
      max-width: 320px;
    }

    .xp-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .level-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .level-text {
      font-weight: 700;
      font-size: 1rem;
      color: white;
    }

    .level-badge {
      font-size: 0.7rem;
      background: rgba(255,255,255,.2);
      color: white;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 500;
    }

    .xp-ratio {
      font-size: 0.78rem;
      color: #bfdbfe;
    }

    .xp-track {
      height: 10px;
      background: rgba(255,255,255,.25);
      border-radius: 999px;
      overflow: hidden;
    }

    .xp-fill {
      height: 100%;
      background: linear-gradient(90deg, #fcd34d, #fbbf24);
      border-radius: 999px;
      transition: width 0.6s ease;
    }

    .xp-remaining {
      font-size: 0.72rem;
      color: #bfdbfe;
      margin: 4px 0 0;
      text-align: center;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      padding: 0 12px;
      margin-top: -20px;
      margin-bottom: 12px;
    }

    .stat-card {
      background: white;
      border-radius: 10px;
      padding: 12px 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }

    .stat-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 2px;
    }

    .stat-label {
      font-size: 0.7rem;
      color: #6b7280;
    }

    /* Sync */
    .sync-section {
      padding: 0 12px 12px;
    }

    .sync-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
    }

    .sync-btn:hover:not(:disabled) { opacity: 0.9; }
    .sync-btn:disabled { opacity: 0.6; cursor: default; }

    /* Section */
    .section {
      background: white;
      border-top: 1px solid rgba(0,0,0,.06);
      border-bottom: 1px solid rgba(0,0,0,.06);
      margin-bottom: 8px;
    }

    .section-header {
      padding: 12px 16px 8px;
      border-bottom: 1px solid #f3f4f6;
    }

    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Achievements */
    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      padding: 12px 16px;
    }

    .achievement-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: default;
    }

    .achievement-icon {
      width: 44px;
      height: 44px;
      background: #fef9c3;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      margin-bottom: 4px;
    }

    .achievement-name {
      font-size: 0.65rem;
      color: #374151;
      text-align: center;
      font-weight: 500;
    }

    /* Activities */
    .activity-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f9fafb;
    }

    .activity-emoji { font-size: 1.2rem; width: 28px; text-align: center; flex-shrink: 0; }

    .activity-details { flex: 1; min-width: 0; }

    .activity-name {
      font-size: 0.88rem;
      font-weight: 500;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .activity-meta { font-size: 0.75rem; color: #6b7280; margin-top: 1px; }

    .activity-xp {
      font-size: 0.85rem;
      font-weight: 700;
      color: #2563eb;
      flex-shrink: 0;
    }

    .no-activities { padding: 1rem 1rem; color: #6b7280; font-size: 0.85rem; margin: 0; }

    /* Logout */
    .logout-section { padding: 0; }

    .logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 16px;
      background: none;
      border: none;
      color: #dc2626;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.1s;
    }

    .logout-btn:hover { background: #fef2f2; }

    .page-bottom { height: 1rem; }

    /* Not logged in */
    .not-logged {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      text-align: center;
    }
    .not-logged-icon { font-size: 3rem; margin-bottom: 1rem; }
    .not-logged p { color: #6b7280; }
  `],
})
export class ProfileComponent implements OnInit {
  activities = signal<any[]>([]);
  userAchievements = signal<any[]>([]);
  syncing = signal(false);

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadActivities();
    this.loadAchievements();
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
    this.syncing.set(true);
    this.http.post<{ imported: number; skipped: number }>(`${environment.apiUrl}/api/activities/sync-all`, {}).subscribe({
      next: (result) => {
        this.snackBar.open(
          `${result.imported} activité(s) importée(s)`,
          '✕',
          { duration: 4000 },
        );
        this.loadActivities();
        this.syncing.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la synchronisation', '✕', { duration: 3000 });
        this.syncing.set(false);
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
