import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface AdminUser {
  id: string;
  stravaId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  region: string;
  country: string;
  xpTotal: number;
  xpRun: number;
  xpBike: number;
  level: number;
  role: 'athlete' | 'admin';
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  template: `
    <div class="admin-page">

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats().totalUsers }}</div>
          <div class="stat-label">Membres</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().totalActivities }}</div>
          <div class="stat-label">Activités</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().totalXPDistributed | number }}</div>
          <div class="stat-label">XP distribués</div>
        </div>
      </div>

      <!-- Actions -->
      <div class="actions-bar">
        <button class="btn btn-primary" (click)="recalculateXP()" [disabled]="recalcLoading()">
          @if (recalcLoading()) { ⏳ Recalcul en cours… } @else { 🔄 Recalculer tout l'XP }
        </button>
        @if (recalcMsg()) {
          <span class="recalc-msg">{{ recalcMsg() }}</span>
        }
      </div>

      <!-- Tabs -->
      <div class="tabs-bar">
        <button class="tab" [class.active]="activeTab() === 'users'" (click)="activeTab.set('users')">
          👥 Membres
          @if (activeTab() === 'users') { <span class="tab-indicator"></span> }
        </button>
        <button class="tab" [class.active]="activeTab() === 'achievements'" (click)="activeTab.set('achievements')">
          🏆 Achievements
          @if (activeTab() === 'achievements') { <span class="tab-indicator"></span> }
        </button>
      </div>

      <!-- Users tab -->
      @if (activeTab() === 'users') {
        <div class="section">
          <div class="user-list">
            @for (u of users(); track u.id) {
              <div class="user-card" [class.inactive]="!u.isActive">
                <img class="user-avatar" [src]="u.avatarUrl || 'assets/avatar-default.png'" [alt]="u.firstName" />
                <div class="user-info">
                  <div class="user-name">
                    {{ u.firstName }} {{ u.lastName }}
                    <span class="badge" [class.badge-admin]="u.role === 'admin'" [class.badge-athlete]="u.role === 'athlete'">
                      {{ u.role === 'admin' ? '🛡️ Admin' : '🏃 Athlète' }}
                    </span>
                    @if (!u.isActive) { <span class="badge badge-inactive">Inactif</span> }
                  </div>
                  <div class="user-meta">
                    Strava #{{ u.stravaId }} · {{ u.region || 'N/A' }}
                  </div>
                  <div class="user-xp">
                    <span class="xp-chip global">🌍 {{ u.xpTotal | number }} XP</span>
                    <span class="xp-chip run">🏃 {{ u.xpRun | number }} XP</span>
                    <span class="xp-chip bike">🚴 {{ u.xpBike | number }} XP</span>
                    <span class="xp-chip level">Niv. {{ u.level }}</span>
                  </div>
                </div>
                <div class="user-actions">
                  <button class="btn-sm btn-role" (click)="toggleRole(u)"
                    [title]="u.role === 'admin' ? 'Rétrograder en athlète' : 'Promouvoir admin'">
                    {{ u.role === 'admin' ? '↓ Athlète' : '↑ Admin' }}
                  </button>
                  <button class="btn-sm btn-active" (click)="toggleActive(u)"
                    [title]="u.isActive ? 'Désactiver' : 'Réactiver'">
                    {{ u.isActive ? '⛔ Désactiver' : '✅ Réactiver' }}
                  </button>
                  <button class="btn-sm btn-delete" (click)="deleteUser(u)" title="Supprimer">
                    🗑️
                  </button>
                </div>
              </div>
            }
            @if (users().length === 0) {
              <div class="empty">Aucun membre</div>
            }
          </div>
        </div>
      }

      <!-- Achievements tab -->
      @if (activeTab() === 'achievements') {
        <div class="section">
          <div class="achievement-list">
            @for (a of achievements(); track a.id) {
              <div class="achievement-card">
                <div class="achievement-info">
                  <div class="achievement-name">{{ a.name }}</div>
                  <div class="achievement-code">{{ a.code }}</div>
                  <div class="achievement-cond">{{ a.conditionType }} ≥ {{ a.conditionValue }}</div>
                </div>
                <button class="btn-sm btn-delete" (click)="deleteAchievement(a)" title="Supprimer">🗑️</button>
              </div>
            }
            @if (achievements().length === 0) {
              <div class="empty">Aucun achievement</div>
            }
          </div>
        </div>
      }

      <!-- Toast -->
      @if (toast()) {
        <div class="toast">{{ toast() }}</div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      padding: 16px;
      max-width: 900px;
      margin: 0 auto;
      padding-bottom: 80px;
    }

    /* Stats */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 14px 10px;
      text-align: center;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #e67e22;
    }

    .stat-label {
      font-size: 0.72rem;
      color: #6b7280;
      margin-top: 2px;
    }

    /* Actions */
    .actions-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .recalc-msg {
      font-size: 0.85rem;
      color: #16a34a;
      font-weight: 500;
    }

    /* Tabs */
    .tabs-bar {
      display: flex;
      background: white;
      border-bottom: 1px solid rgba(0,0,0,.08);
      border-radius: 12px 12px 0 0;
      overflow: hidden;
      margin-bottom: 0;
    }

    .tab {
      flex: 1;
      padding: 13px 16px;
      background: none;
      border: none;
      font-size: 0.88rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      position: relative;
      font-family: inherit;
      transition: color 0.15s;
    }

    .tab.active { color: #e67e22; }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: #e67e22;
      border-radius: 2px 2px 0 0;
    }

    /* Section */
    .section {
      background: white;
      border-radius: 0 0 12px 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,.08);
      overflow: hidden;
    }

    /* User cards */
    .user-list { display: flex; flex-direction: column; }

    .user-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.1s;
    }

    .user-card.inactive { opacity: 0.5; }
    .user-card:last-child { border-bottom: none; }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .user-info { flex: 1; min-width: 0; }

    .user-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 3px;
    }

    .user-meta {
      font-size: 0.72rem;
      color: #6b7280;
      margin-bottom: 6px;
    }

    .user-xp { display: flex; flex-wrap: wrap; gap: 4px; }

    .xp-chip {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 2px 7px;
      border-radius: 999px;
    }

    .xp-chip.global { background: #f3f4f6; color: #374151; }
    .xp-chip.run    { background: #dcfce7; color: #15803d; }
    .xp-chip.bike   { background: #dbeafe; color: #1d4ed8; }
    .xp-chip.level  { background: #fef3c7; color: #92400e; }

    .badge {
      font-size: 0.68rem;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
    }

    .badge-admin    { background: #fef3c7; color: #92400e; }
    .badge-athlete  { background: #f0fdf4; color: #15803d; }
    .badge-inactive { background: #fee2e2; color: #991b1b; }

    .user-actions {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex-shrink: 0;
    }

    /* Achievement cards */
    .achievement-list { display: flex; flex-direction: column; }

    .achievement-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #f3f4f6;
    }

    .achievement-card:last-child { border-bottom: none; }

    .achievement-info { flex: 1; }

    .achievement-name { font-size: 0.88rem; font-weight: 600; color: #111827; }
    .achievement-code { font-size: 0.72rem; color: #6b7280; font-family: monospace; }
    .achievement-cond { font-size: 0.75rem; color: #4b5563; margin-top: 2px; }

    /* Buttons */
    .btn {
      padding: 10px 18px;
      border: none;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-primary { background: #e67e22; color: white; }

    .btn-sm {
      padding: 5px 10px;
      border: none;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
    }

    .btn-role   { background: #ede9fe; color: #5b21b6; }
    .btn-active { background: #f3f4f6; color: #374151; }
    .btn-delete { background: #fee2e2; color: #991b1b; }

    .empty {
      padding: 2.5rem;
      text-align: center;
      color: #6b7280;
      font-size: 0.9rem;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      background: #111827;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      z-index: 1000;
      white-space: nowrap;
      pointer-events: none;
    }
  `],
})
export class AdminComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  achievements = signal<any[]>([]);
  stats = signal({ totalUsers: 0, totalActivities: 0, totalXPDistributed: 0 });
  activeTab = signal<'users' | 'achievements'>('users');
  recalcLoading = signal(false);
  recalcMsg = signal('');
  toast = signal('');

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAll();
  }

  toggleRole(u: AdminUser) {
    const newRole = u.role === 'admin' ? 'athlete' : 'admin';
    this.http.patch<AdminUser>(`${this.api}/api/admin/users/${u.id}`, { role: newRole }).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.showToast(`${u.firstName} est maintenant ${newRole}`);
      },
    });
  }

  toggleActive(u: AdminUser) {
    this.http.patch<AdminUser>(`${this.api}/api/admin/users/${u.id}`, { isActive: !u.isActive }).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.showToast(updated.isActive ? `${u.firstName} réactivé` : `${u.firstName} désactivé`);
      },
    });
  }

  deleteUser(u: AdminUser) {
    if (!confirm(`Supprimer ${u.firstName} ${u.lastName} ? Cette action est irréversible.`)) return;
    this.http.delete(`${this.api}/api/admin/users/${u.id}`).subscribe({
      next: () => {
        this.users.update(list => list.filter(x => x.id !== u.id));
        this.showToast('Utilisateur supprimé');
      },
    });
  }

  deleteAchievement(a: any) {
    if (!confirm(`Supprimer "${a.name}" ?`)) return;
    this.http.delete(`${this.api}/api/admin/achievements/${a.id}`).subscribe({
      next: () => {
        this.achievements.update(list => list.filter(x => x.id !== a.id));
        this.showToast('Achievement supprimé');
      },
    });
  }

  recalculateXP() {
    this.recalcLoading.set(true);
    this.recalcMsg.set('');
    this.http.post<{ recalculated: number }>(`${this.api}/api/admin/recalculate-xp`, {}).subscribe({
      next: (res) => {
        this.recalcLoading.set(false);
        this.recalcMsg.set(`✅ ${res.recalculated} utilisateurs recalculés`);
        this.loadAll();
      },
      error: () => {
        this.recalcLoading.set(false);
        this.recalcMsg.set('❌ Erreur lors du recalcul');
      },
    });
  }

  private loadAll() {
    this.http.get<AdminUser[]>(`${this.api}/api/admin/users`).subscribe({ next: d => this.users.set(d) });
    this.http.get<any[]>(`${this.api}/api/admin/achievements`).subscribe({ next: d => this.achievements.set(d) });
    this.http.get<any>(`${this.api}/api/admin/stats`).subscribe({ next: d => this.stats.set(d) });
  }

  private showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
