import {
  Entity, PrimaryGeneratedColumn, Column, OneToMany,
} from 'typeorm';
import { UserAchievement } from './user-achievement.entity';

export enum ConditionType {
  LEVEL = 'level',
  TOTAL_XP = 'total_xp',
  ACTIVITY_COUNT = 'activity_count',
  DISTANCE_TOTAL = 'distance_total',
  STREAK_DAYS = 'streak_days',
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true, name: 'icon_url' })
  iconUrl: string;

  @Column({ type: 'int', nullable: true, name: 'xp_threshold' })
  xpThreshold: number;

  @Column({ type: 'enum', enum: ConditionType, name: 'condition_type' })
  conditionType: ConditionType;

  @Column({ type: 'int', name: 'condition_value' })
  conditionValue: number;

  @OneToMany(() => UserAchievement, (ua) => ua.achievement)
  userAchievements: UserAchievement[];
}
