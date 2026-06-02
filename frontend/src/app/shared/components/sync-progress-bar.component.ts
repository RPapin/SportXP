import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncProgressService } from '../../core/services/sync-progress.service';

@Component({
  selector: 'app-sync-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (sync.isSyncing()) {
      <div class="sync-bar" [class.done]="sync.isDone()" [class.has-remaining]="sync.isDone() && sync.remaining() > 0">
        <div class="sync-bar__inner">

          <div class="sync-bar__text">
            @if (sync.isDone() && sync.remaining() > 0) {
              <span class="sync-bar__icon">⚠</span>
              <span>{{ sync.imported() }} importée{{ sync.imported() !== 1 ? 's' : '' }} · {{ sync.remaining() }} restante{{ sync.remaining() !== 1 ? 's' : '' }}</span>
              @if (sync.cooldownSeconds() > 0) {
                <span class="sync-bar__count">sync dans {{ sync.formatCooldown(sync.cooldownSeconds()) }}</span>
              }
            } @else if (sync.isDone()) {
              <span class="sync-bar__icon">✓</span>
              <span>{{ sync.imported() }} activité{{ sync.imported() !== 1 ? 's' : '' }} importée{{ sync.imported() !== 1 ? 's' : '' }}</span>
            } @else {
              <span class="sync-bar__icon spin">↻</span>
              <span>Synchronisation</span>
              <span class="sync-bar__count">{{ sync.imported() }} / {{ sync.total() }}</span>
            }
          </div>

          <div class="sync-bar__track">
            <div class="sync-bar__fill" [style.width.%]="sync.percent()"></div>
          </div>

        </div>
      </div>
    }
  `,
  styles: [`
    .sync-bar {
      position: fixed;
      bottom: 62px;
      left: 0;
      right: 0;
      z-index: 200;
      padding: 0 12px 6px;
      pointer-events: none;
    }

    .sync-bar__inner {
      background: #1e293b;
      border-radius: 12px;
      padding: 10px 14px 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,.25);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .sync-bar.done .sync-bar__inner       { background: #14532d; }
    .sync-bar.has-remaining .sync-bar__inner { background: #78350f; }

    .sync-bar__text {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #f1f5f9;
    }

    .sync-bar__count {
      margin-left: auto;
      font-weight: 700;
      color: #94a3b8;
      font-size: 0.8rem;
    }

    .sync-bar__icon { font-size: 1rem; line-height: 1; }

    .spin {
      display: inline-block;
      animation: spin 1s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .sync-bar__track {
      height: 4px;
      background: rgba(255,255,255,.15);
      border-radius: 2px;
      overflow: hidden;
    }

    .sync-bar__fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    .sync-bar.done .sync-bar__fill         { background: #22c55e; }
    .sync-bar.has-remaining .sync-bar__fill { background: #f59e0b; }

    @media (min-width: 768px) {
      .sync-bar {
        left: 50%;
        right: auto;
        transform: translateX(-50%);
        width: 380px;
        padding: 0 0 12px;
      }
    }
  `],
})
export class SyncProgressBarComponent {
  sync = inject(SyncProgressService);
}
