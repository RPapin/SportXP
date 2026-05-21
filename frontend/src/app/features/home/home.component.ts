import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { ActivityMapPreviewComponent } from './activity-map-preview.component';

const SPORT_CONFIG: Record<string, { emoji: string; label: string; color: string }> = {
  Run:              { emoji: '🏃', label: 'Course à pied', color: '#22c55e' },
  TrailRun:         { emoji: '🏔️', label: 'Trail', color: '#84cc16' },
  Ride:             { emoji: '🚴', label: 'Vélo', color: '#3b82f6' },
  MountainBikeRide: { emoji: '🚵', label: 'VTT', color: '#8b5cf6' },
  GravelRide:       { emoji: '🚴', label: 'Gravel', color: '#06b6d4' },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, ActivityMapPreviewComponent],
  template: `
    <div class="feed-root">

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab" [class.active]="activeTab() === 'activities'" (click)="activeTab.set('activities')">
          Activités
          @if (activeTab() === 'activities') { <span class="tab-line"></span> }
        </button>
        <button class="tab" [class.active]="activeTab() === 'favorites'" (click)="activeTab.set('favorites')">
          Favoris
          @if (activeTab() === 'favorites') { <span class="tab-line"></span> }
        </button>
        <button class="tab" [class.active]="activeTab() === 'notifications'" (click)="activeTab.set('notifications')">
          Notifications
          @if (activeTab() === 'notifications') { <span class="tab-line"></span> }
        </button>
      </div>

      <!-- Feed -->
      @if (activeTab() === 'activities') {

        @if (!auth.isLoggedIn()) {
          <div class="login-banner">
            <div class="login-icon">🏆</div>
            <h2>SportXP</h2>
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
          @if (loading()) {
            @for (i of [1,2,3]; track i) {
              <div class="card skeleton-card">
                <div class="card-header">
                  <div class="sk sk-circle"></div>
                  <div class="sk-lines">
                    <div class="sk sk-line" style="width:55%"></div>
                    <div class="sk sk-line" style="width:30%"></div>
                  </div>
                </div>
                <div class="sk sk-map"></div>
                <div class="card-body">
                  <div class="sk sk-line" style="width:70%;margin-bottom:8px"></div>
                  <div class="sk sk-line" style="width:90%"></div>
                </div>
                <div class="card-footer">
                  <div class="sk sk-line" style="width:40%"></div>
                </div>
              </div>
            }
          }

          @for (activity of activities(); track activity.id) {
            <article class="card">
              <!-- Header -->
              <div class="card-header">
                <img
                  class="avatar"
                  [src]="activity.user?.avatarUrl || 'assets/avatar-default.png'"
                  [alt]="activity.user?.firstName"
                  (error)="onImgError($event)"
                />
                <div class="author-block">
                  <div class="author-line">
                    <span class="author-name">{{ activity.user?.firstName }} {{ activity.user?.lastName }}</span>
                    <span class="author-action"> a fait une sortie</span>
                  </div>
                  <div class="author-time">{{ timeAgo(activity.startDate) }}</div>
                </div>
                <button class="menu-btn" aria-label="Plus d'options">
                  <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                </button>
              </div>

              <!-- Map -->
              <div class="map-wrap">
                @if (activity.geojson) {
                  <app-activity-map-preview
                    [geojson]="activity.geojson"
                    [color]="sportColor(activity.sportType)"
                  />
                } @else {
                  <div class="no-map">
                    <span class="no-map-emoji">{{ sportEmoji(activity.sportType) }}</span>
                    <span class="no-map-text">Pas de tracé GPS</span>
                  </div>
                }
              </div>

              <!-- Body -->
              <div class="card-body">
                <div class="post-title">{{ activity.name }}</div>
                <div class="post-desc">
                  {{ sportLabel(activity.sportType) }} · {{ (activity.distanceM / 1000) | number:'1.1-1' }} km · +{{ activity.xpEarned | number:'1.0-0' }} XP
                </div>
              </div>

              <!-- Footer -->
              <div class="card-footer">
                <button class="react-btn" [class.liked]="activity.likedByMe" (click)="toggleLike(activity)">
                  <svg width="17" height="17" viewBox="0 0 24 24" [attr.fill]="activity.likedByMe ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{{ activity.likesCount }} j'aime</span>
                </button>
                <button class="react-btn" [class.active-comment]="openComments().has(activity.id)" (click)="toggleComments(activity)">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>{{ activity.commentsCount }} commentaires</span>
                </button>
              </div>

              <!-- Comments section -->
              @if (openComments().has(activity.id)) {
                <div class="comments-section">
                  @if (commentsLoading().has(activity.id)) {
                    <div class="comments-loading">Chargement…</div>
                  }
                  @for (comment of (commentsCache().get(activity.id) ?? []); track comment.id) {
                    <div class="comment-row">
                      <img class="comment-avatar" [src]="comment.user.avatarUrl || 'assets/avatar-default.png'" [alt]="comment.user.firstName" />
                      <div class="comment-bubble">
                        <span class="comment-author">{{ comment.user.firstName }} {{ comment.user.lastName }}</span>
                        <span class="comment-text">{{ comment.content }}</span>
                      </div>
                      @if (comment.user.id === auth.currentUser()?.id) {
                        <button class="comment-delete" (click)="deleteComment(activity, comment.id)" title="Supprimer">✕</button>
                      }
                    </div>
                  }
                  @if (auth.isLoggedIn()) {
                    <div class="comment-form">
                      <img class="comment-avatar" [src]="auth.currentUser()?.avatarUrl || 'assets/avatar-default.png'" alt="moi" />
                      <input
                        class="comment-input"
                        type="text"
                        placeholder="Ajouter un commentaire…"
                        [(ngModel)]="commentDrafts[activity.id]"
                        (keydown.enter)="submitComment(activity)"
                      />
                      <button class="comment-send" (click)="submitComment(activity)" [disabled]="!commentDrafts[activity.id]?.trim()">
                        ➤
                      </button>
                    </div>
                  }
                </div>
              }
            </article>
          }

          @if (activities().length === 0 && !loading()) {
            <div class="empty-state">
              <div class="empty-icon">🏃</div>
              <p>Aucune activité pour l'instant.</p>
              <p class="empty-sub">Connecte ton compte Strava et commence à accumuler des XP !</p>
            </div>
          }
        </div>
      }

      @if (activeTab() === 'favorites') {
        <div class="empty-state">
          <div class="empty-icon">⭐</div>
          <p>Aucun favori</p>
          <p class="empty-sub">Tes activités favorites apparaîtront ici.</p>
        </div>
      }

      @if (activeTab() === 'notifications') {
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>Aucune notification</p>
          <p class="empty-sub">Tu seras notifié des nouvelles activités de tes amis.</p>
        </div>
      }

    </div>
  `,
  styles: [`
    .feed-root {
      background: #f3f4f6;
      min-height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* ── Tabs ── */
    .tabs-bar {
      display: flex;
      background: white;
      border-bottom: 1px solid rgba(0,0,0,.07);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tab {
      flex: 1;
      padding: 14px 8px;
      background: none;
      border: none;
      font-size: 0.875rem;
      font-weight: 500;
      color: #9ca3af;
      cursor: pointer;
      position: relative;
      font-family: inherit;
      transition: color 0.15s;
    }

    .tab.active { color: #111827; font-weight: 600; }

    .tab-line {
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 2px;
      background: #111827;
      border-radius: 2px 2px 0 0;
    }

    /* ── Login banner ── */
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

    /* ── Feed list ── */
    .activities-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 8px 0;
    }

    /* ── Card ── */
    .card { background: white; }

    /* Header */
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
    }

    .avatar {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .author-block { flex: 1; min-width: 0; }

    .author-line { font-size: 0.875rem; color: #111827; line-height: 1.3; }
    .author-name { font-weight: 700; }
    .author-action { font-weight: 400; color: #374151; }
    .author-time { font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }

    .menu-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      cursor: pointer;
      flex-shrink: 0;
      border-radius: 50%;
      transition: background 0.1s;
      padding: 0;
    }
    .menu-btn:hover { background: #f3f4f6; }

    .dot {
      display: block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #6b7280;
    }

    /* Map */
    .map-wrap {
      width: 100%;
      height: 220px;
      overflow: hidden;
    }

    .no-map {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #f9fafb;
    }
    .no-map-emoji { font-size: 2rem; }
    .no-map-text { font-size: 0.8rem; color: #9ca3af; }

    /* Body */
    .card-body { padding: 12px 16px 8px; }

    .post-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }

    .post-desc { font-size: 0.82rem; color: #6b7280; line-height: 1.5; }

    /* Footer */
    .card-footer {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 8px 16px 12px;
      border-bottom: 1px solid #f3f4f6;
    }

    .react-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      font-size: 0.82rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      font-family: inherit;
      font-weight: 500;
      transition: color 0.15s;
    }
    .react-btn:hover { color: #374151; }
    .react-btn.liked { color: #ef4444; }
    .react-btn.liked svg { stroke: #ef4444; }
    .react-btn.active-comment { color: #2563eb; }
    .react-btn.active-comment svg { stroke: #2563eb; }

    /* Comments */
    .comments-section {
      padding: 8px 16px 12px;
      background: #fafafa;
      border-top: 1px solid #f3f4f6;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .comments-loading { font-size: 0.8rem; color: #9ca3af; padding: 4px 0; }

    .comment-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .comment-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .comment-bubble {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 7px 10px;
      font-size: 0.82rem;
      line-height: 1.4;
      border: 1px solid #e5e7eb;
    }

    .comment-author { font-weight: 600; color: #111827; margin-right: 6px; }
    .comment-text { color: #374151; }

    .comment-delete {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      font-size: 0.75rem;
      padding: 2px 4px;
      align-self: center;
      border-radius: 4px;
      transition: color 0.1s;
    }
    .comment-delete:hover { color: #ef4444; }

    .comment-form {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .comment-input {
      flex: 1;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 7px 14px;
      font-size: 0.82rem;
      font-family: inherit;
      outline: none;
      background: white;
      transition: border-color 0.15s;
    }
    .comment-input:focus { border-color: #2563eb; }

    .comment-send {
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      font-size: 0.85rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: opacity 0.15s;
    }
    .comment-send:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── Empty state ── */
    .empty-state { text-align: center; padding: 4rem 1.5rem; }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state p { color: #374151; font-weight: 500; margin: 0; }
    .empty-sub { color: #6b7280 !important; font-size: 0.85rem; margin-top: 0.5rem !important; font-weight: 400 !important; }

    /* ── Skeleton ── */
    .skeleton-card { padding: 0; }
    .sk { background: #e5e7eb; border-radius: 6px; animation: pulse 1.5s ease-in-out infinite; }
    .sk-circle { width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0; }
    .sk-line { height: 12px; }
    .sk-map { height: 220px; border-radius: 0; }
    .sk-lines { flex: 1; display: flex; flex-direction: column; gap: 8px; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {
  activities = signal<any[]>([]);
  loading = signal(true);
  activeTab = signal<'activities' | 'favorites' | 'notifications'>('activities');
  openComments = signal<Set<string>>(new Set());
  commentsCache = signal<Map<string, any[]>>(new Map());
  commentsLoading = signal<Set<string>>(new Set());

  commentDrafts: Record<string, string> = {};

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
      this.activities.update((list) => [{
        ...activity,
        likesCount: 0,
        commentsCount: 0,
        likedByMe: false,
      }, ...list]);
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

  toggleLike(activity: any) {
    if (!this.auth.isLoggedIn()) return;
    this.http.post<{ liked: boolean; count: number }>(
      `${environment.apiUrl}/api/activities/${activity.id}/like`, {}
    ).subscribe({
      next: ({ liked, count }) => {
        this.activities.update(list =>
          list.map(a => a.id === activity.id ? { ...a, likedByMe: liked, likesCount: count } : a)
        );
      },
    });
  }

  toggleComments(activity: any) {
    const current = new Set(this.openComments());
    if (current.has(activity.id)) {
      current.delete(activity.id);
      this.openComments.set(current);
    } else {
      current.add(activity.id);
      this.openComments.set(current);
      if (!this.commentsCache().has(activity.id)) {
        this.loadComments(activity.id);
      }
    }
  }

  loadComments(activityId: string) {
    const loading = new Set(this.commentsLoading());
    loading.add(activityId);
    this.commentsLoading.set(loading);

    this.http.get<any[]>(`${environment.apiUrl}/api/activities/${activityId}/comments`).subscribe({
      next: (comments) => {
        const cache = new Map(this.commentsCache());
        cache.set(activityId, comments);
        this.commentsCache.set(cache);

        const l = new Set(this.commentsLoading());
        l.delete(activityId);
        this.commentsLoading.set(l);
      },
    });
  }

  submitComment(activity: any) {
    const content = this.commentDrafts[activity.id]?.trim();
    if (!content) return;
    this.commentDrafts[activity.id] = '';
    this.http.post<any>(`${environment.apiUrl}/api/activities/${activity.id}/comments`, { content }).subscribe({
      next: (comment) => {
        const cache = new Map(this.commentsCache());
        cache.set(activity.id, [...(cache.get(activity.id) ?? []), comment]);
        this.commentsCache.set(cache);
        this.activities.update(list =>
          list.map(a => a.id === activity.id ? { ...a, commentsCount: a.commentsCount + 1 } : a)
        );
      },
    });
  }

  deleteComment(activity: any, commentId: string) {
    this.http.delete(`${environment.apiUrl}/api/activities/comments/${commentId}`).subscribe({
      next: () => {
        const cache = new Map(this.commentsCache());
        cache.set(activity.id, (cache.get(activity.id) ?? []).filter((c: any) => c.id !== commentId));
        this.commentsCache.set(cache);
        this.activities.update(list =>
          list.map(a => a.id === activity.id ? { ...a, commentsCount: Math.max(0, a.commentsCount - 1) } : a)
        );
      },
    });
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
    const diffMin = Math.floor(diffMs / 60000);
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'à l\'instant';
    if (diffMin < 60) return `il y a ${diffMin} min.`;
    if (diffH < 24) return `il y a ${diffH}h`;
    if (diffD === 1) return 'hier';
    if (diffD < 7) return `il y a ${diffD}j`;
    return then.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  sportEmoji(type: string): string { return SPORT_CONFIG[type]?.emoji ?? '⚡'; }
  sportLabel(type: string): string { return SPORT_CONFIG[type]?.label ?? type; }
  sportColor(type: string): string { return SPORT_CONFIG[type]?.color ?? '#f97316'; }

  onImgError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/avatar-default.png';
  }
}
