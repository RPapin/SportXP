import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, Location } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { getLevelFromXP, getProgressPercent, getXPForLevel } from '../../shared/pipes/xp-level.pipe';
import { environment } from '../../../environments/environment';

const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_activity:   '🏁',
  distance_100:     '🏆',
  distance_500:     '🌟',
  streak_7:         '🔥',
  streak_30:        '💪',
  explorer:         '🗺️',
  speed_demon:      '⚡',
  mountain_goat:    '⛰️',
};

const SPORT_ICONS: Record<string, string> = {
  Run: '🏃', TrailRun: '🏔️', Ride: '🚴',
  MountainBikeRide: '🚵', GravelRide: '🚴',
};

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.css',
})
export class PublicProfileComponent implements OnInit {
  profile = signal<any>(null);
  activities = signal<any[]>([]);
  loading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private location: Location,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.http.get<any>(`${environment.apiUrl}/api/users/${id}`).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.loading.set(false);
      },
      error: () => {
        this.profile.set(null);
        this.loading.set(false);
      },
    });
    this.http.get<any[]>(`${environment.apiUrl}/api/activities/user/${id}`).subscribe({
      next: (data) => this.activities.set(data),
    });
  }

  back() { this.location.back(); }

  level(xp: number): number   { return getLevelFromXP(xp ?? 0); }
  progress(xp: number): number { return getProgressPercent(xp ?? 0); }
  nextXP(xp: number): number  { return getXPForLevel(getLevelFromXP(xp ?? 0) + 1); }

  achievementIcon(name: string): string {
    const key = name?.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return ACHIEVEMENT_ICONS[key] ?? '🏅';
  }

  sportIcon(type: string): string {
    return SPORT_ICONS[type] ?? '⚡';
  }
}
