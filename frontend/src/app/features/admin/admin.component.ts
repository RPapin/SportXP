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

interface AchievementForm {
  code: string;
  name: string;
  description: string;
  conditionType: string;
  conditionValue: number | null;
  xpThreshold: number | null;
}

const CONDITION_LABELS: Record<string, string> = {
  level: 'Niveau',
  total_xp: 'XP total',
  activity_count: 'Nb activités',
  distance_total: 'Distance (m)',
  streak_days: 'Streak (jours)',
};

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  achievements = signal<any[]>([]);
  stats = signal({ totalUsers: 0, totalActivities: 0, totalXPDistributed: 0 });
  activeTab = signal<'users' | 'achievements'>('users');
  recalcLoading = signal(false);
  recalcMsg = signal('');
  toast = signal('');
  showCreateForm = signal(false);
  editingId = signal('');

  createForm: AchievementForm = this.emptyForm();
  editForm: AchievementForm = this.emptyForm();

  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAll();
  }

  conditionLabel(type: string): string {
    return CONDITION_LABELS[type] ?? type;
  }

  toggleCreateForm() {
    this.showCreateForm.update(v => !v);
    if (this.showCreateForm()) {
      this.createForm = this.emptyForm();
      this.editingId.set('');
    }
  }

  startEdit(a: any) {
    this.editingId.set(a.id);
    this.showCreateForm.set(false);
    this.editForm = {
      code: a.code,
      name: a.name,
      description: a.description ?? '',
      conditionType: a.conditionType,
      conditionValue: a.conditionValue,
      xpThreshold: a.xpThreshold ?? null,
    };
  }

  submitCreate() {
    const body = {
      ...this.createForm,
      conditionValue: Number(this.createForm.conditionValue),
      xpThreshold: this.createForm.xpThreshold != null ? Number(this.createForm.xpThreshold) : null,
    };
    this.http.post<any>(`${this.api}/api/admin/achievements`, body).subscribe({
      next: (created) => {
        this.achievements.update(list => [...list, created]);
        this.showCreateForm.set(false);
        this.createForm = this.emptyForm();
        this.showToast('Achievement créé');
      },
    });
  }

  submitEdit(id: string) {
    const body = {
      ...this.editForm,
      conditionValue: Number(this.editForm.conditionValue),
      xpThreshold: this.editForm.xpThreshold != null ? Number(this.editForm.xpThreshold) : null,
    };
    this.http.patch<any>(`${this.api}/api/admin/achievements/${id}`, body).subscribe({
      next: (updated) => {
        this.achievements.update(list => list.map(x => x.id === id ? updated : x));
        this.editingId.set('');
        this.showToast('Achievement modifié');
      },
    });
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

  private emptyForm(): AchievementForm {
    return { code: '', name: '', description: '', conditionType: 'total_xp', conditionValue: null, xpThreshold: null };
  }
}
