import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany,
} from 'typeorm';
import { Activity } from './activity.entity';
import { XpLog } from './xp-log.entity';
import { UserAchievement } from './user-achievement.entity';

export enum UserRole {
  ATHLETE = 'athlete',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint', unique: true, name: 'strava_id' })
  stravaId: number;

  @Column({ nullable: true })
  username: string;

  @Column({ nullable: true, name: 'first_name' })
  firstName: string;

  @Column({ nullable: true, name: 'last_name' })
  lastName: string;

  @Column({ nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'int', default: 0, name: 'xp_total' })
  xpTotal: number;

  @Column({ type: 'int', default: 0, name: 'xp_run' })
  xpRun: number;

  @Column({ type: 'int', default: 0, name: 'xp_bike' })
  xpBike: number;

  @Column({ type: 'text', nullable: true, name: 'strava_access_token' })
  stravaAccessToken: string;

  @Column({ type: 'text', nullable: true, name: 'strava_refresh_token' })
  stravaRefreshToken: string;

  @Column({ type: 'bigint', nullable: true, name: 'token_expires_at' })
  tokenExpiresAt: number;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.ATHLETE })
  role: UserRole;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Activity, (a) => a.user)
  activities: Activity[];

  @OneToMany(() => XpLog, (l) => l.user)
  xpLogs: XpLog[];

  @OneToMany(() => UserAchievement, (ua) => ua.user)
  userAchievements: UserAchievement[];

  get level(): number {
    return getLevelFromXP(this.xpTotal);
  }
}

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
