import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
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
    private router: Router,
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

  goToProfile(id: string | undefined) {
    if (id) this.router.navigate(['/users', id]);
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
