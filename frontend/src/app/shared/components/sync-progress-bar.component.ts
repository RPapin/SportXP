import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncProgressService } from '../../core/services/sync-progress.service';

@Component({
  selector: 'app-sync-progress-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sync-progress-bar.component.html',
  styleUrl: './sync-progress-bar.component.css',
})
export class SyncProgressBarComponent {
  sync = inject(SyncProgressService);
}
