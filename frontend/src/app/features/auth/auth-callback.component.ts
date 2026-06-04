import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AutoSyncService } from '../../core/services/auto-sync.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  templateUrl: './auth-callback.component.html',
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService,
    private autoSync: AutoSyncService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.handleCallback(token);
      await this.authService.init();
      await this.autoSync.checkAndSync();
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/home']);
    }
  }
}
