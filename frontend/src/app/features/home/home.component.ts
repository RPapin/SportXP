import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { WebsocketService } from '../../core/services/websocket.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, DatePipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule],
  template: `
    <div class="home-container">
      <header class="home-header">
        <h1>ObjectifMilliard <span class="beta">XP</span></h1>
        <p class="subtitle">Grimpe, accumule des XP, domine le leaderboard</p>
        @if (!auth.isLoggedIn()) {
          <button mat-raised-button color="primary" (click)="auth.loginWithStrava()">
            <mat-icon>directions_run</mat-icon>
            Connecter avec Strava
          </button>
        }
      </header>

      <section class="feed">
        <h2>Activités récentes</h2>
        @for (activity of activities(); track activity.id) {
          <mat-card class="activity-card">
            <mat-card-header>
              <img mat-card-avatar [src]="activity.user?.avatarUrl || '/assets/avatar-default.png'" [alt]="activity.user?.firstName">
              <mat-card-title>{{ activity.user?.firstName }} {{ activity.user?.lastName }}</mat-card-title>
              <mat-card-subtitle>{{ activity.startDate | date:'dd/MM/yyyy HH:mm' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="activity-info">
                <mat-chip>{{ activity.sportType }}</mat-chip>
                <span class="distance">{{ (activity.distanceM / 1000) | number:'1.1-1' }} km</span>
                <span class="xp">+{{ activity.xpEarned | number:'1.0-0' }} XP</span>
              </div>
              <p class="activity-name">{{ activity.name }}</p>
            </mat-card-content>
          </mat-card>
        }
        @if (activities().length === 0) {
          <p class="empty-state">Aucune activité pour l'instant. Sois le premier à en ajouter !</p>
        }
      </section>
    </div>
  `,
  styles: [`
    .home-container { max-width: 800px; margin: 0 auto; padding: 1rem; }
    .home-header { text-align: center; padding: 2rem 0; }
    .home-header h1 { font-size: 2.5rem; margin: 0; }
    .beta { color: #e67e22; font-weight: 800; }
    .subtitle { color: #666; margin: 0.5rem 0 1.5rem; }
    .feed h2 { border-bottom: 2px solid #e67e22; padding-bottom: 0.5rem; }
    .activity-card { margin-bottom: 1rem; }
    .activity-info { display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem; }
    .distance { font-weight: 600; }
    .xp { color: #e67e22; font-weight: 700; font-size: 1.1rem; }
    .activity-name { color: #444; font-style: italic; margin: 0; }
    .empty-state { text-align: center; color: #999; padding: 2rem; }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {
  activities = signal<any[]>([]);
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
        `${activity.userName} vient de terminer "${activity.name}" (+${Math.round(activity.xpEarned)} XP)`,
        'Fermer',
        { duration: 4000 },
      );
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private loadFeed() {
    this.http.get<any[]>(`${environment.apiUrl}/api/activities`).subscribe({
      next: (data) => this.activities.set(data),
    });
  }
}
