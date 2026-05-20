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
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  loginWithStrava() {
    window.location.href = `${environment.apiUrl}/api/auth/strava`;
  }

  handleCallback(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
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
