import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { SyncProgressBarComponent } from './shared/components/sync-progress-bar.component';

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Actualités',
  '/map': 'Carte',
  '/leaderboard': 'Classement',
  '/profile': 'Profil',
  '/club': 'Club',
  '/admin': 'Admin',
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, SyncProgressBarComponent],
  template: `
    <div class="app-shell">
      @if (showNav()) {
        <header class="app-header">
          <h1 class="header-title">{{ pageTitle() }}</h1>
        </header>
      }

      <div class="content-area" [class.no-nav]="!showNav()">
        <router-outlet />
      </div>

      <app-sync-progress-bar />

      @if (showNav()) {
        <nav class="bottom-nav">
          <a class="nav-item" routerLink="/home" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Accueil</span>
          </a>
          <a class="nav-item" routerLink="/map" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" x2="9" y1="3" y2="18"/>
              <line x1="15" x2="15" y1="6" y2="21"/>
            </svg>
            <span>Carte</span>
          </a>
          <a class="nav-item" routerLink="/leaderboard" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            <span>Classement</span>
          </a>
          <a class="nav-item" routerLink="/profile" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="5"/>
              <path d="M20 21a8 8 0 1 0-16 0"/>
            </svg>
            <span>Profil</span>
          </a>
          <a class="nav-item" routerLink="/club" routerLinkActive="active">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Club</span>
          </a>
          @if (auth.isLoggedIn() && auth.isAdmin()) {
            <a class="nav-item nav-item--admin" routerLink="/admin" routerLinkActive="active">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Admin</span>
            </a>
          }
        </nav>
      }
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }

    .app-shell {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: #f9fafb;
      overflow: hidden;
    }

    .app-header {
      flex-shrink: 0;
      background: white;
      border-bottom: 1px solid rgba(0,0,0,.08);
      padding: 14px 24px;
      display: flex;
      align-items: center;
      z-index: 10;
    }

    .header-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .content-area {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    .bottom-nav {
      flex-shrink: 0;
      background: white;
      border-top: 1px solid rgba(0,0,0,.08);
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 4px 0;
    }

    @media (min-width: 768px) {
      .content-area {
        padding: 0 10%;
      }

      .bottom-nav {
        justify-content: center;
        gap: 8px;
        padding: 6px 0;
      }
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      padding: 8px 10px;
      border-radius: 8px;
      color: #6b7280;
      transition: color 0.15s, background 0.15s;
      cursor: pointer;
      min-width: 0;
    }

    .nav-item:hover {
      color: #374151;
      background: #f3f4f6;
    }

    .nav-item span {
      font-size: 0.65rem;
      font-weight: 500;
    }

    .nav-item svg {
      width: 22px;
      height: 22px;
    }

    .nav-item.active {
      color: #2563eb;
    }

    .nav-item--admin { color: #9ca3af; }
    .nav-item--admin:hover { color: #e67e22; background: #fff7ed; }
    .nav-item--admin.active { color: #e67e22; }
  `],
})
export class AppComponent {
  pageTitle = signal('Actualités');
  showNav = signal(true);

  constructor(public auth: AuthService, router: Router) {
    router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const url: string = e.urlAfterRedirects;
      this.showNav.set(!url.startsWith('/auth'));
      const segment = '/' + url.split('/')[1].split('?')[0];
      this.pageTitle.set(PAGE_TITLES[segment] ?? 'SportXP');
    });
  }
}
