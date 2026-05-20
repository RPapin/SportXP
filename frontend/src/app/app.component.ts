import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule,
  ],
  template: `
    <mat-toolbar color="primary" class="navbar">
      <span class="brand" routerLink="/home">ObjectifMilliard<strong>XP</strong></span>
      <span class="spacer"></span>
      <nav class="nav-links">
        <a mat-button routerLink="/home" routerLinkActive="active-link">Feed</a>
        @if (auth.isLoggedIn()) {
          <a mat-button routerLink="/map" routerLinkActive="active-link">Carte</a>
          <a mat-button routerLink="/leaderboard" routerLinkActive="active-link">Classement</a>
          <a mat-button routerLink="/profile" routerLinkActive="active-link">Profil</a>
          @if (auth.isAdmin()) {
            <a mat-button routerLink="/admin" routerLinkActive="active-link">Admin</a>
          }
          <button mat-icon-button (click)="auth.logout()" title="Déconnexion">
            <mat-icon>logout</mat-icon>
          </button>
        } @else {
          <button mat-raised-button (click)="auth.loginWithStrava()">
            Connecter avec Strava
          </button>
        }
      </nav>
    </mat-toolbar>
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .navbar { position: sticky; top: 0; z-index: 1000; }
    .brand { font-size: 1.2rem; cursor: pointer; letter-spacing: -0.5px; }
    .brand strong { color: #e67e22; }
    .spacer { flex: 1; }
    .nav-links { display: flex; align-items: center; gap: 0.25rem; }
    .active-link { background: rgba(255,255,255,0.15); border-radius: 4px; }
    .main-content { min-height: calc(100vh - 64px); background: #f5f5f5; }
  `],
})
export class AppComponent {
  constructor(public auth: AuthService) {}
}
