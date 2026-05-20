import {
  Entity, ManyToOne, JoinColumn, Column, PrimaryColumn, CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @PrimaryColumn({ name: 'achievement_id' })
  achievementId: string;

  @ManyToOne(() => User, (u) => u.userAchievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Achievement, (a) => a.userAchievements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;

  @CreateDateColumn({ name: 'unlocked_at' })
  unlockedAt: Date;
}
