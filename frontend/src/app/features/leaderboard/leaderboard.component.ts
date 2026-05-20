import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe, MatTableModule, MatTabsModule, MatCardModule, MatSelectModule, FormsModule],
  template: `
    <div class="leaderboard-container">
      <h1>Classement</h1>

      <div class="filters">
        <mat-select [(ngModel)]="selectedRegion" (ngModelChange)="loadLeaderboard()" placeholder="Toutes les régions">
          <mat-option value="">Toutes les régions</mat-option>
          @for (r of regions; track r) {
            <mat-option [value]="r">{{ r }}</mat-option>
          }
        </mat-select>
      </div>

      <mat-card>
        <table mat-table [dataSource]="entries()" class="full-width">
          <ng-container matColumnDef="rank">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let row" [class.me]="row.id === auth.currentUser()?.id">
              {{ row.rank }}
            </td>
          </ng-container>

          <ng-container matColumnDef="athlete">
            <th mat-header-cell *matHeaderCellDef>Athlète</th>
            <td mat-cell *matCellDef="let row" [class.me]="row.id === auth.currentUser()?.id">
              <div class="athlete-cell">
                <img [src]="row.avatarUrl || '/assets/avatar-default.png'" class="avatar">
                <span>{{ row.firstName }} {{ row.lastName }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="region">
            <th mat-header-cell *matHeaderCellDef>Région</th>
            <td mat-cell *matCellDef="let row" [class.me]="row.id === auth.currentUser()?.id">{{ row.region }}</td>
          </ng-container>

          <ng-container matColumnDef="level">
            <th mat-header-cell *matHeaderCellDef>Niveau</th>
            <td mat-cell *matCellDef="let row" [class.me]="row.id === auth.currentUser()?.id">
              <span class="level-badge">Niv. {{ row.level }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="xp">
            <th mat-header-cell *matHeaderCellDef>XP Total</th>
            <td mat-cell *matCellDef="let row" [class.me]="row.id === auth.currentUser()?.id">
              <strong>{{ row.xpTotal | number }}</strong>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>
      </mat-card>
    </div>
  `,
  styles: [`
    .leaderboard-container { max-width: 900px; margin: 0 auto; padding: 1rem; }
    h1 { color: #e67e22; }
    .filters { margin-bottom: 1rem; }
    .filters mat-select { min-width: 200px; }
    .full-width { width: 100%; }
    .athlete-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; }
    .level-badge { background: #e67e22; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 600; }
    tr.me td { background: rgba(230, 126, 34, 0.1); font-weight: 700; }
  `],
})
export class LeaderboardComponent implements OnInit {
  entries = signal<any[]>([]);
  columns = ['rank', 'athlete', 'region', 'level', 'xp'];
  selectedRegion = '';
  regions = ['Île-de-France', 'Auvergne-Rhône-Alpes', 'Occitanie', 'Bretagne', 'PACA'];

  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    const params = this.selectedRegion ? `?region=${encodeURIComponent(this.selectedRegion)}` : '';
    this.http.get<any[]>(`${environment.apiUrl}/api/users/leaderboard${params}`).subscribe({
      next: (data) => this.entries.set(data),
    });
  }
}
