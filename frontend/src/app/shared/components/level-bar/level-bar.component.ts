import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getLevelFromXP, getProgressPercent, getXPForLevel } from '../../pipes/xp-level.pipe';

@Component({
  selector: 'app-level-bar',
  standalone: true,
  imports: [CommonModule, MatProgressBarModule],
  templateUrl: './level-bar.component.html',
  styleUrl: './level-bar.component.css',
})
export class LevelBarComponent {
  @Input() xp = 0;

  get level(): number { return getLevelFromXP(this.xp); }
  get progress(): number { return getProgressPercent(this.xp); }
  get nextLevelXP(): number { return getXPForLevel(this.level + 1); }
}
