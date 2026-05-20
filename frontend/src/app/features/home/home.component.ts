import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { ActivityMapPreviewComponent } from './activity-map-preview.component';

const SPORT_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  Run:              { emoji: '🏃', label: 'Course', color: '#22c55e' },
  TrailRun:         { emoji: '🏔️', label: 'Trail', color: '#84cc16' },
  Ride:             { emoji: '🚴', label: 'Vélo', color: '#3b82f6' },
  MountainBikeRide: { emoji: '🚵', label: 'VTT', color: '#8b5cf6' },
  GravelRide:       { emoji: '🚴', label: 'Gravel', color: '#06b6d4' },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatSnackBarModule, ActivityMapPreviewComponent],
  template: `
    <div class="feed-container">
      @if (!auth.isLoggedIn()) {
        <div class="login-banner">
          <div class="login-icon">🏆</div>
          <h2>ObjectifMilliard XP</h2>
          <p>Grimpe, accumule des XP, domine le leaderboard</p>
          <button class="strava-btn" (click)="auth.loginWithStrava()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/>
            </svg>
            Connecter avec Strava
          </button>
        </div>
      }

      <div class="activities-list">
        @for (activity of activities(); track activity.id) {
          <article class="activity-card">
            <div class="card-header">
              <img
                class="avatar"
                [src]="activity.user?.avatarUrl || 'assets/avatar-default.png'"
                [alt]="activity.user?.firstName"
                (error)="onImgError($event)"
              />
              <div class="author-info">
                <div class="author-name">{{ activity.user?.firstName }} {{ activity.user?.lastName }}</div>
                <div class="activity-time">{{ timeAgo(activity.startDate) }}</div>
              </div>
              <div class="sport-badge" [style.background]="sportBg(activity.sportType)">
                <span>{{ sportEmoji(activity.sportType) }}</span>
                <span>{{ sportLabel(activity.sportType) }}</span>
              </div>
            </div>

            <div class="card-body">
              <h3 class="activity-title">{{ activity.name }}</h3>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-label">Distance</div>
                  <div class="stat-value">{{ (activity.distanceM / 1000) | number:'1.1-1' }} km</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">XP gagnés</div>
                  <div class="stat-value xp">+{{ activity.xpEarned | number:'1.0-0' }}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">Type</div>
                  <div class="stat-value">{{ sportLabel(activity.sportType) }}</div>
                </div>
                <div class="stat-box">
                  <div class="stat-label">Date</div>
                  <div class="stat-value">{{ activity.startDate | date:'dd MMM' }}</div>
                </div>
              </div>
            </div>

            <div class="route-preview">
              @if (activity.geojson) {
                <app-activity-map-preview
                  [geojson]="activity.geojson"
                  [color]="sportBg(activity.sportType)"
                />
              } @else {
                <div class="no-route">
                  <span>{{ sportEmoji(activity.sportType) }}</span>
                  <span>Pas de tracé GPS</span>
                </div>
              }
              <div class="route-badge">
                <span>{{ sportEmoji(activity.sportType) }}</span>
                <span>{{ (activity.distanceM / 1000) | number:'1.1-1' }} km</span>
              </div>
            </div>

            <div class="card-footer">
              <div class="engagement-left">
                <button class="eng-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>J'aime</span>
                </button>
                <button class="eng-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Commenter</span>
                </button>
              </div>
              <button class="eng-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                </svg>
                <span>Partager</span>
              </button>
            </div>
          </article>
        }

        @if (activities().length === 0 && !loading()) {
          <div class="empty-state">
            <div class="empty-icon">🏃</div>
            <p>Aucune activité pour l'instant.</p>
            <p class="empty-sub">Connecte ton compte Strava et commence à accumuler des XP !</p>
          </div>
        }

        @if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton-header">
                <div class="skeleton-circle"></div>
                <div class="skeleton-lines">
                  <div class="skeleton-line w-40"></div>
                  <div class="skeleton-line w-24"></div>
                </div>
              </div>
              <div class="skeleton-body">
                <div class="skeleton-line w-full"></div>
                <div class="skeleton-grid">
                  @for (j of [1,2,3,4]; track j) {
                    <div class="skeleton-stat"></div>
                  }
                </div>
              </div>
              <div class="skeleton-route"></div>
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .feed-container {
      background: #f9fafb;
      min-height: 100%;
    }

    /* Login Banner */
    .login-banner {
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      padding: 2.5rem 1.5rem;
      text-align: center;
      color: white;
    }
    .login-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .login-banner h2 { font-size: 1.5rem; font-weight: 700; margin: 0 0 0.5rem; }
    .login-banner p { color: #bfdbfe; margin: 0 0 1.5rem; font-size: 0.9rem; }
    .strava-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #fc4c02;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 999px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .strava-btn:hover { opacity: 0.9; }

    /* Activity Card */
    .activity-card {
      background: white;
      border-bottom: 8px solid #f3f4f6;
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 16px 10px;
    }

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .author-info { flex: 1; }
    .author-name { font-weight: 600; color: #111827; font-size: 0.9rem; }
    .activity-time { font-size: 0.78rem; color: #6b7280; margin-top: 1px; }

    .sport-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      color: white;
      flex-shrink: 0;
    }

    .card-body { padding: 0 16px 12px; }

    .activity-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 10px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .stat-box {
      background: #f9fafb;
      border-radius: 8px;
      padding: 8px 10px;
    }

    .stat-label {
      font-size: 0.68rem;
      color: #6b7280;
      margin-bottom: 2px;
    }

    .stat-value {
      font-size: 0.82rem;
      font-weight: 600;
      color: #111827;
    }

    .stat-value.xp { color: #2563eb; }

    /* Route Preview */
    .route-preview {
      position: relative;
      height: 160px;
      overflow: hidden;
    }

    .no-route {
      width: 100%;
      height: 100%;
      background: #f3f4f6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 0.8rem;
      color: #9ca3af;
    }

    .no-route span:first-child { font-size: 1.5rem; }

    .route-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(255,255,255,0.92);
      border-radius: 8px;
      padding: 4px 8px;
      font-size: 0.72rem;
      font-weight: 600;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,.1);
    }

    /* Engagement */
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px 14px;
      border-top: 1px solid #f3f4f6;
    }

    .engagement-left { display: flex; gap: 4px; }

    .eng-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border: none;
      background: transparent;
      color: #6b7280;
      font-size: 0.82rem;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.1s, color 0.1s;
      font-family: inherit;
    }

    .eng-btn:hover { background: #f3f4f6; color: #374151; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 1.5rem;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p { color: #374151; font-weight: 500; margin: 0; }
    .empty-sub { color: #6b7280; font-size: 0.85rem; margin-top: 0.5rem !important; }

    /* Skeleton */
    .skeleton-card {
      background: white;
      border-bottom: 8px solid #f3f4f6;
      padding: 14px 16px;
    }
    .skeleton-header { display: flex; gap: 10px; margin-bottom: 12px; }
    .skeleton-circle { width: 42px; height: 42px; border-radius: 50%; background: #e5e7eb; flex-shrink: 0; }
    .skeleton-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
    .skeleton-line { height: 12px; border-radius: 6px; background: #e5e7eb; }
    .w-40 { width: 40%; }
    .w-24 { width: 24%; }
    .w-full { width: 100%; }
    .skeleton-body { margin-bottom: 12px; }
    .skeleton-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
    .skeleton-stat { height: 52px; border-radius: 8px; background: #e5e7eb; }
    .skeleton-route { height: 160px; border-radius: 0; background: #e5e7eb; }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {
  activities = signal<any[]>([]);
  loading = signal(true);
  private sub!: Subscription;

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private wsService: WebsocketService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.loadFeed();
    this.sub = this.wsService.newActivity$.subscribe((activity) => {
      this.activities.update((list) => [activity, ...list]);
      this.snackBar.open(
        `${activity.userName} — "${activity.name}" (+${Math.round(activity.xpEarned)} XP)`,
        '✕',
        { duration: 4000 },
      );
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private loadFeed() {
    this.loading.set(true);
    this.http.get<any[]>(`${environment.apiUrl}/api/activities`).subscribe({
      next: (data) => {
        this.activities.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  timeAgo(date: string | Date): string {
    if (!date) return '';
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffH < 1) return 'à l\'instant';
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffD === 1) return 'hier';
    if (diffD < 7) return `il y a ${diffD}j`;
    return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  sportEmoji(type: string): string {
    return SPORT_CONFIG[type]?.emoji ?? '⚡';
  }

  sportLabel(type: string): string {
    return SPORT_CONFIG[type]?.label ?? type;
  }

  sportBg(type: string): string {
    return SPORT_CONFIG[type]?.color ?? '#f97316';
  }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/avatar-default.png';
  }
}
