import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getLevelFromXP, getProgressPercent, getXPForLevel } from '../../pipes/xp-level.pipe';

@Component({
  selector: 'app-level-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  template: `
    <div class="level-bar-container">
      <div class="level-info">
        <span class="level-label">Niveau {{ level }}</span>
        <span class="xp-label">{{ xp }} XP / {{ nextLevelXP }} XP</span>
      </div>
      <mat-progress-bar mode="determinate" [value]="progress" color="accent"></mat-progress-bar>
    </div>
  `,
  styles: [`
    .level-bar-container { width: 100%; }
    .level-info { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 0.85rem; }
    .level-label { font-weight: 600; color: #e67e22; }
    .xp-label { color: #666; }
  `],
})
export class LevelBarComponent {
  @Input() xp = 0;

  get level(): number { return getLevelFromXP(this.xp); }
  get progress(): number { return getProgressPercent(this.xp); }
  get nextLevelXP(): number { return getXPForLevel(this.level + 1); }
}
