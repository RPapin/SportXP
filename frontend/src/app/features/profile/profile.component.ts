import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { LevelBarComponent } from '../../shared/components/level-bar/level-bar.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatSnackBarModule, MatTooltipModule, LevelBarComponent],
  template: `
    <div class="profile-container">
      @if (auth.currentUser(); as user) {
        <mat-card class="profile-header-card">
          <mat-card-content>
            <div class="profile-header">
              <img class="avatar" [src]="user.avatarUrl" [alt]="user.firstName">
              <div class="profile-info">
                <h2>{{ user.firstName }} {{ user.lastName }}</h2>
                <p class="location">{{ user.city }}{{ user.region ? ', ' + user.region : '' }}{{ user.country ? ', ' + user.country : '' }}</p>
                <app-level-bar [xp]="user.xpTotal"></app-level-bar>
              </div>
            </div>
            <div class="stats-grid">
              <div class="stat">
                <span class="stat-value">{{ user.xpTotal | number }}</span>
                <span class="stat-label">XP Total</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ activities().length }}</span>
                <span class="stat-label">Activités</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ totalDistanceKm() | number:'1.0-0' }}</span>
                <span class="stat-label">km parcourus</span>
              </div>
            </div>
            <button mat-raised-button color="accent" (click)="syncActivities()" [disabled]="syncing()">
              <mat-icon>sync</mat-icon>
              {{ syncing() ? 'Synchronisation...' : 'Synchroniser mes activités' }}
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="achievements-card">
          <mat-card-header><mat-card-title>Achievements</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="achievements-grid">
              @for (ua of userAchievements(); track ua.id) {
                <div class="achievement-badge" [matTooltip]="ua.description">
                  <mat-icon color="accent">emoji_events</mat-icon>
                  <span>{{ ua.name }}</span>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header><mat-card-title>Mes dernières activités</mat-card-title></mat-card-header>
          <mat-card-content>
            @for (a of activities(); track a.id) {
              <div class="activity-row">
                <mat-icon>{{ sportIcon(a.sportType) }}</mat-icon>
                <div class="activity-details">
                  <span class="activity-name">{{ a.name }}</span>
                  <span class="activity-meta">{{ (a.distanceM / 1000) | number:'1.1-1' }} km · {{ a.startDate | date:'dd/MM/yy' }}</span>
                </div>
                <span class="activity-xp">+{{ a.xpEarned | number:'1.0-0' }} XP</span>
              </div>
              <mat-divider></mat-divider>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .profile-container { max-width: 900px; margin: 0 auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
    .profile-header { display: flex; gap: 1.5rem; align-items: flex-start; margin-bottom: 1.5rem; }
    .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
    .profile-info { flex: 1; }
    .profile-info h2 { margin: 0 0 0.25rem; }
    .location { color: #666; margin: 0 0 1rem; font-size: 0.9rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0; text-align: center; }
    .stat { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: #e67e22; }
    .stat-label { font-size: 0.8rem; color: #666; }
    .achievements-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .achievement-badge { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 0.5rem; border: 1px solid #e67e22; border-radius: 8px; min-width: 80px; text-align: center; cursor: default; }
    .achievement-badge span { font-size: 0.75rem; }
    .activity-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; }
    .activity-details { flex: 1; display: flex; flex-direction: column; }
    .activity-name { font-weight: 500; }
    .activity-meta { font-size: 0.8rem; color: #666; }
    .activity-xp { color: #e67e22; font-weight: 700; }
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

  totalDistanceKm(): number {
    return this.activities().reduce((sum, a) => sum + a.distanceM, 0) / 1000;
  }

  syncActivities() {
    this.syncing.set(true);
    this.http.post<{ imported: number; skipped: number }>(`${environment.apiUrl}/api/activities/sync-all`, {}).subscribe({
      next: (result) => {
        this.snackBar.open(`${result.imported} activités importées, ${result.skipped} ignorées`, 'OK', { duration: 4000 });
        this.loadActivities();
        this.syncing.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la synchronisation', 'OK', { duration: 3000 });
        this.syncing.set(false);
      },
    });
  }

  sportIcon(type: string): string {
    const icons: Record<string, string> = {
      Run: 'directions_run', Ride: 'directions_bike', Hike: 'hiking',
      Walk: 'directions_walk', Swim: 'pool', Ski: 'downhill_skiing',
    };
    return icons[type] ?? 'fitness_center';
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
