import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  stravaId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  city: string;
  region: string;
  country: string;
  xpTotal: number;
  level: number;
  role: 'athlete' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'stravaxp_jwt';
  private readonly SLOT_KEY = 'stravaxp_slot';
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  loginWithStrava() {
    const slot = localStorage.getItem(this.SLOT_KEY);
    const url = slot
      ? `${environment.apiUrl}/api/auth/strava?slot=${slot}`
      : `${environment.apiUrl}/api/auth/strava`;
    window.location.href = url;
  }

  handleCallback(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    // Cache the slot from the JWT so returning users re-use the same Strava app
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { stravaKeySlot?: number };
      if (payload.stravaKeySlot) {
        localStorage.setItem(this.SLOT_KEY, String(payload.stravaKeySlot));
      }
    } catch { /* ignore malformed token */ }
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    // Keep SLOT_KEY so the next login reuses the correct Strava app
    this.currentUser.set(null);
    this.router.navigate(['/home']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

  async init(): Promise<void> {
    const token = this.getToken();
    if (!token) return;
    try {
      const user = await firstValueFrom(
        this.http.get<AuthUser>(`${environment.apiUrl}/api/auth/me`),
      );
      this.currentUser.set(user);
    } catch {
      this.logout();
    }
  }
}
