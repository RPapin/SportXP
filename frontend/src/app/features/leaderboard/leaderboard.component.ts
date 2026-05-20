import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { getLevelFromXP } from '../../shared/pipes/xp-level.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  template: `
    <div class="leaderboard-page">
      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab" [class.active]="activeTab() === 'global'" (click)="activeTab.set('global')">
          Global
          @if (activeTab() === 'global') { <span class="tab-indicator"></span> }
        </button>
        <button class="tab" [class.active]="activeTab() === 'region'" (click)="setRegionTab()">
          Ma région
          @if (activeTab() === 'region') { <span class="tab-indicator"></span> }
        </button>
      </div>

      <div class="list-area">
        <!-- Podium Top 3 -->
        @if (top3().length === 3) {
          <div class="podium">
            <!-- 2nd place -->
            <div class="podium-item">
              <img class="podium-avatar silver" [src]="top3()[1].avatarUrl || 'assets/avatar-default.png'" [alt]="top3()[1].firstName" />
              <div class="podium-rank silver-rank">2</div>
              <div class="podium-name">{{ top3()[1].firstName }}</div>
              <div class="podium-pts silver-pts">{{ top3()[1].xpTotal | number }} XP</div>
            </div>
            <!-- 1st place -->
            <div class="podium-item podium-first">
              <div class="crown">👑</div>
              <img class="podium-avatar gold" [src]="top3()[0].avatarUrl || 'assets/avatar-default.png'" [alt]="top3()[0].firstName" />
              <div class="podium-rank gold-rank">1</div>
              <div class="podium-name">{{ top3()[0].firstName }}</div>
              <div class="podium-pts gold-pts">{{ top3()[0].xpTotal | number }} XP</div>
            </div>
            <!-- 3rd place -->
            <div class="podium-item">
              <img class="podium-avatar bronze" [src]="top3()[2].avatarUrl || 'assets/avatar-default.png'" [alt]="top3()[2].firstName" />
              <div class="podium-rank bronze-rank">3</div>
              <div class="podium-name">{{ top3()[2].firstName }}</div>
              <div class="podium-pts bronze-pts">{{ top3()[2].xpTotal | number }} XP</div>
            </div>
          </div>
        }

        <!-- Ranked List -->
        <div class="rank-list">
          @for (entry of rest(); track entry.id) {
            <div class="rank-row" [class.is-me]="entry.id === auth.currentUser()?.id">
              <div class="rank-number" [class.top-rank]="entry.rank <= 3">{{ entry.rank }}</div>
              <img class="rank-avatar" [src]="entry.avatarUrl || 'assets/avatar-default.png'" [alt]="entry.firstName" />
              <div class="rank-info">
                <div class="rank-name">
                  {{ entry.firstName }} {{ entry.lastName }}
                  @if (entry.id === auth.currentUser()?.id) {
                    <span class="me-badge">Vous</span>
                  }
                </div>
                <div class="rank-meta">
                  Niv. {{ level(entry.xpTotal) }}
                  @if (entry.region) { · {{ entry.region }} }
                </div>
              </div>
              <div class="rank-xp">
                <div class="xp-value">{{ entry.xpTotal | number }}</div>
                <div class="xp-label">XP</div>
              </div>
            </div>
          }

          @if (entries().length === 0) {
            <div class="empty">
              <div class="empty-icon">🏅</div>
              <p>Aucun résultat pour l'instant</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .leaderboard-page {
      display: flex;
      flex-direction: column;
      min-height: 100%;
      background: #f9fafb;
    }

    /* Tabs */
    .tabs-bar {
      display: flex;
      background: white;
      border-bottom: 1px solid rgba(0,0,0,.08);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .tab {
      flex: 1;
      padding: 14px 16px;
      background: none;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      position: relative;
      font-family: inherit;
      transition: color 0.15s;
    }

    .tab.active { color: #2563eb; }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #2563eb;
      border-radius: 2px 2px 0 0;
    }

    /* Podium */
    .podium {
      background: linear-gradient(135deg, #fefce8, #fff7ed);
      padding: 24px 16px 20px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      gap: 16px;
    }

    .podium-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
    }

    .podium-first {
      margin-bottom: 16px;
    }

    .crown { font-size: 1.5rem; margin-bottom: 4px; }

    .podium-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
      margin-bottom: 8px;
    }

    .podium-first .podium-avatar { width: 68px; height: 68px; }

    .gold   { border: 3px solid #fbbf24; }
    .silver { border: 3px solid #9ca3af; }
    .bronze { border: 3px solid #d97706; }

    .podium-rank {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 6px;
      border: 2px solid white;
    }

    .gold-rank   { background: #fbbf24; color: #78350f; }
    .silver-rank { background: #9ca3af; color: white; }
    .bronze-rank { background: #d97706; color: white; }

    .podium-first .podium-rank { width: 34px; height: 34px; font-size: 1rem; }

    .podium-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: #111827;
      text-align: center;
      margin-bottom: 2px;
    }

    .podium-pts { font-size: 0.72rem; font-weight: 700; }
    .gold-pts   { color: #92400e; }
    .silver-pts { color: #4b5563; }
    .bronze-pts { color: #92400e; }

    /* List */
    .list-area { flex: 1; }

    .rank-list {
      background: white;
    }

    .rank-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.1s;
    }

    .rank-row.is-me {
      background: #eff6ff;
    }

    .rank-number {
      width: 28px;
      text-align: center;
      font-size: 1rem;
      font-weight: 600;
      color: #6b7280;
      flex-shrink: 0;
    }

    .rank-number.top-rank { color: #111827; }

    .rank-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .is-me .rank-avatar { outline: 2px solid #2563eb; outline-offset: 1px; }

    .rank-info { flex: 1; min-width: 0; }

    .rank-name {
      font-size: 0.88rem;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .is-me .rank-name { color: #2563eb; }

    .me-badge {
      font-size: 0.68rem;
      background: #2563eb;
      color: white;
      padding: 1px 7px;
      border-radius: 999px;
      font-weight: 600;
    }

    .rank-meta {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 2px;
    }

    .rank-xp {
      text-align: right;
      flex-shrink: 0;
    }

    .xp-value { font-weight: 700; font-size: 0.9rem; color: #111827; }
    .xp-label { font-size: 0.68rem; color: #6b7280; }

    .empty {
      padding: 3rem;
      text-align: center;
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .empty p { color: #6b7280; margin: 0; }
  `],
})
export class LeaderboardComponent implements OnInit {
  entries = signal<any[]>([]);
  activeTab = signal<'global' | 'region'>('global');

  top3 = computed(() => this.entries().length >= 3 ? this.entries().slice(0, 3) : []);
  rest = computed(() => this.entries().length >= 3 ? this.entries().slice(3) : this.entries());

  constructor(public auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.loadLeaderboard();
  }

  setRegionTab() {
    this.activeTab.set('region');
    const region = this.auth.currentUser()?.region;
    this.loadLeaderboard(region);
  }

  loadLeaderboard(region?: string) {
    const params = region ? `?region=${encodeURIComponent(region)}` : '';
    this.http.get<any[]>(`${environment.apiUrl}/api/users/leaderboard${params}`).subscribe({
      next: (data) => this.entries.set(data),
    });
  }

  level(xp: number): number {
    return getLevelFromXP(xp ?? 0);
  }
}
