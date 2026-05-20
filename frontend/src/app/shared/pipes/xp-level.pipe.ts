import { Pipe, PipeTransform } from '@angular/core';

export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (getXPForLevel(level + 1) <= xp) level++;
  return level;
}

export function getXPForLevel(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5));
}

export function getProgressPercent(xp: number): number {
  const currentLevel = getLevelFromXP(xp);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  return Math.round(((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100);
}

@Pipe({ name: 'xpToLevel', standalone: true })
export class XpToLevelPipe implements PipeTransform {
  transform(xp: number): number {
    return getLevelFromXP(xp);
  }
}

@Pipe({ name: 'xpProgress', standalone: true })
export class XpProgressPipe implements PipeTransform {
  transform(xp: number): number {
    return getProgressPercent(xp);
  }
}
