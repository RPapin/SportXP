import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
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
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="profile-page">
      <!-- Back button -->
      <button class="back-btn" (click)="back()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M19 12H5"/>
          <path d="M12 19l-7-7 7-7"/>
        </svg>
        Classement
      </button>

      @if (loading()) {
        <div class="loader-wrap">
          <div class="loader"></div>
        </div>
      } @else if (profile(); as p) {
        <!-- Gradient Header -->
        <div class="profile-header">
          <img
            class="profile-avatar"
            [src]="p.avatarUrl || 'assets/avatar-default.png'"
            [alt]="p.firstName"
          />
          <h2 class="profile-name">{{ p.firstName }} {{ p.lastName }}</h2>
          @if (p.city || p.country) {
            <p class="profile-location">
              {{ p.city }}{{ p.city && p.country ? ', ' : '' }}{{ p.country }}
            </p>
          }

          <!-- XP Bar -->
          <div class="xp-bar-container">
            <div class="xp-bar-header">
              <div class="level-info">
                <span class="level-text">Niveau {{ level(p.xpTotal) }}</span>
                <span class="level-badge">Athlète</span>
              </div>
              <span class="xp-ratio">{{ p.xpTotal | number }} / {{ nextXP(p.xpTotal) | number }} XP</span>
            </div>
            <div class="xp-track">
              <div class="xp-fill" [style.width.%]="progress(p.xpTotal)"></div>
            </div>
            <p class="xp-remaining">{{ (nextXP(p.xpTotal) - p.xpTotal) | number }} XP jusqu'au niveau {{ level(p.xpTotal) + 1 }}</p>
          </div>
        </div>

        <!-- Stats Cards -->
        <div class="stats-row">
          <div class="stat-card">
            <div class="stat-value">{{ p.xpTotal | number }}</div>
            <div class="stat-label">XP Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ p.activityCount }}</div>
            <div class="stat-label">Activités</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ (p.totalDistanceM / 1000) | number:'1.0-0' }}</div>
            <div class="stat-label">km parcourus</div>
          </div>
        </div>

        <!-- Achievements -->
        @if (p.achievements?.length > 0) {
          <div class="section">
            <div class="section-header">
              <h3 class="section-title"><span>🏅</span> Trophées</h3>
            </div>
            <div class="achievements-grid">
              @for (ua of p.achievements; track ua.id) {
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
            <h3 class="section-title"><span>⚡</span> Activités récentes</h3>
          </div>
          @for (a of activities().slice(0, 20); track a.id) {
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
            <p class="no-activities">Aucune activité</p>
          }
        </div>

        <div class="page-bottom"></div>
      } @else {
        <div class="not-found">
          <div class="not-found-icon">👤</div>
          <p>Profil introuvable</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page {
      background: #f9fafb;
      min-height: 100%;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      background: white;
      border: none;
      border-bottom: 1px solid rgba(0,0,0,.07);
      color: #2563eb;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      font-family: inherit;
      transition: background 0.1s;
    }
    .back-btn:hover { background: #eff6ff; }

    .loader-wrap {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }
    .loader {
      width: 36px;
      height: 36px;
      border: 3px solid #e5e7eb;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

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

    .xp-bar-container { width: 100%; max-width: 320px; }

    .xp-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .level-info { display: flex; align-items: center; gap: 6px; }
    .level-text { font-weight: 700; font-size: 1rem; color: white; }
    .level-badge {
      font-size: 0.7rem;
      background: rgba(255,255,255,.2);
      color: white;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 500;
    }
    .xp-ratio { font-size: 0.78rem; color: #bfdbfe; }

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

    .stat-label { font-size: 0.7rem; color: #6b7280; }

    .section {
      background: white;
      border-top: 1px solid rgba(0,0,0,.06);
      border-bottom: 1px solid rgba(0,0,0,.06);
      margin-bottom: 8px;
    }

    .section-header { padding: 12px 16px 8px; border-bottom: 1px solid #f3f4f6; }

    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

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
    .activity-xp { font-size: 0.85rem; font-weight: 700; color: #2563eb; flex-shrink: 0; }

    .no-activities { padding: 1rem; color: #6b7280; font-size: 0.85rem; margin: 0; }
    .page-bottom { height: 1rem; }

    .not-found {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 2rem;
      text-align: center;
    }
    .not-found-icon { font-size: 3rem; margin-bottom: 1rem; }
    .not-found p { color: #6b7280; }
  `],
})
export class PublicProfileComponent implements OnInit {
  profile = signal<any>(null);
  activities = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<any>(`${environment.apiUrl}/api/users/${id}`).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.profile.set(null);
        this.loading.set(false);
      },
    });
    this.http.get<any[]>(`${environment.apiUrl}/api/activities/user/${id}`).subscribe({
      next: (data) => this.activities.set(data),
    });
  }

  back() { this.router.navigate(['/leaderboard']); }

  level(xp: number): number   { return getLevelFromXP(xp ?? 0); }
  progress(xp: number): number { return getProgressPercent(xp ?? 0); }
  nextXP(xp: number): number  { return getXPForLevel(getLevelFromXP(xp ?? 0) + 1); }

  achievementIcon(name: string): string {
    const key = name?.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return ACHIEVEMENT_ICONS[key] ?? '🏅';
  }

  sportIcon(type: string): string {
    return SPORT_ICONS[type] ?? '⚡';
  }
}
