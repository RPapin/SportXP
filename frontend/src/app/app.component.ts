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
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
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
