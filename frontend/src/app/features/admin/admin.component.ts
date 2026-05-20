import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DecimalPipe, MatTableModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatDialogModule],
  template: `
    <div class="admin-container">
      <h1>Administration</h1>

      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats().totalUsers }}</div>
            <div class="stat-label">Membres</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats().totalActivities }}</div>
            <div class="stat-label">Activités</div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-number">{{ stats().totalXPDistributed | number }}</div>
            <div class="stat-label">XP distribués</div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <mat-tab label="Membres">
          <mat-card>
            <table mat-table [dataSource]="users()" class="full-width">
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nom</th>
                <td mat-cell *matCellDef="let u">{{ u.firstName }} {{ u.lastName }}</td>
              </ng-container>
              <ng-container matColumnDef="region">
                <th mat-header-cell *matHeaderCellDef>Région</th>
                <td mat-cell *matCellDef="let u">{{ u.region }}</td>
              </ng-container>
              <ng-container matColumnDef="xp">
                <th mat-header-cell *matHeaderCellDef>XP</th>
                <td mat-cell *matCellDef="let u">{{ u.xpTotal | number }}</td>
              </ng-container>
              <ng-container matColumnDef="level">
                <th mat-header-cell *matHeaderCellDef>Niveau</th>
                <td mat-cell *matCellDef="let u">{{ u.level }}</td>
              </ng-container>
              <ng-container matColumnDef="role">
                <th mat-header-cell *matHeaderCellDef>Rôle</th>
                <td mat-cell *matCellDef="let u">{{ u.role }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let u">
                  <button mat-icon-button color="warn" (click)="deleteUser(u.id)" title="Supprimer">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="userCols"></tr>
              <tr mat-row *matRowDef="let row; columns: userCols;"></tr>
            </table>
          </mat-card>
        </mat-tab>

        <mat-tab label="Achievements">
          <mat-card>
            <mat-card-content>
              <table mat-table [dataSource]="achievements()" class="full-width">
                <ng-container matColumnDef="code">
                  <th mat-header-cell *matHeaderCellDef>Code</th>
                  <td mat-cell *matCellDef="let a">{{ a.code }}</td>
                </ng-container>
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Nom</th>
                  <td mat-cell *matCellDef="let a">{{ a.name }}</td>
                </ng-container>
                <ng-container matColumnDef="condition">
                  <th mat-header-cell *matHeaderCellDef>Condition</th>
                  <td mat-cell *matCellDef="let a">{{ a.conditionType }} >= {{ a.conditionValue }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let a">
                    <button mat-icon-button color="warn" (click)="deleteAchievement(a.id)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="achievCols"></tr>
                <tr mat-row *matRowDef="let row; columns: achievCols;"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 1rem; }
    h1 { color: #e67e22; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { text-align: center; }
    .stat-number { font-size: 2rem; font-weight: 700; color: #e67e22; }
    .stat-label { color: #666; font-size: 0.9rem; }
    .full-width { width: 100%; }
    mat-tab-group { margin-top: 1rem; }
  `],
})
export class AdminComponent implements OnInit {
  users = signal<any[]>([]);
  achievements = signal<any[]>([]);
  stats = signal({ totalUsers: 0, totalActivities: 0, totalXPDistributed: 0 });

  userCols = ['name', 'region', 'xp', 'level', 'role', 'actions'];
  achievCols = ['code', 'name', 'condition', 'actions'];

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadAll();
  }

  deleteUser(id: string) {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    this.http.delete(`${environment.apiUrl}/api/admin/users/${id}`).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== id));
        this.snackBar.open('Utilisateur supprimé', 'OK', { duration: 2000 });
      },
    });
  }

  deleteAchievement(id: string) {
    if (!confirm('Supprimer cet achievement ?')) return;
    this.http.delete(`${environment.apiUrl}/api/admin/achievements/${id}`).subscribe({
      next: () => {
        this.achievements.update((list) => list.filter((a) => a.id !== id));
        this.snackBar.open('Achievement supprimé', 'OK', { duration: 2000 });
      },
    });
  }

  private loadAll() {
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/users`).subscribe({ next: (d) => this.users.set(d) });
    this.http.get<any[]>(`${environment.apiUrl}/api/admin/achievements`).subscribe({ next: (d) => this.achievements.set(d) });
    this.http.get<any>(`${environment.apiUrl}/api/admin/stats`).subscribe({ next: (d) => this.stats.set(d) });
  }
}
