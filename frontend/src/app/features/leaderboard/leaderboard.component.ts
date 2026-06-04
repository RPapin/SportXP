import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { getLevelFromXP } from '../../shared/pipes/xp-level.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './leaderboard.component.html',
  styleUrl: './leaderboard.component.css',
})
export class LeaderboardComponent implements OnInit {
  entries = signal<any[]>([]);
  activeTab = signal<'global' | 'run' | 'bike'>('global');

  top3 = computed(() => this.entries().length >= 3 ? this.entries().slice(0, 3) : []);
  rest = computed(() => this.entries().length >= 3 ? this.entries().slice(3) : this.entries());

  constructor(public auth: AuthService, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.loadLeaderboard('global');
  }

  setTab(tab: 'global' | 'run' | 'bike') {
    this.activeTab.set(tab);
    this.loadLeaderboard(tab);
  }

  loadLeaderboard(category: 'global' | 'run' | 'bike') {
    this.http.get<any[]>(`${environment.apiUrl}/api/users/leaderboard?category=${category}`).subscribe({
      next: (data) => this.entries.set(data),
    });
  }

  level(xp: number): number {
    return getLevelFromXP(xp ?? 0);
  }

  xp(entry: any): number {
    const tab = this.activeTab();
    if (tab === 'run') return entry.xpRun ?? 0;
    if (tab === 'bike') return entry.xpBike ?? 0;
    return entry.xpTotal ?? 0;
  }

  goToProfile(id: string) {
    this.router.navigate(['/users', id]);
  }
}
