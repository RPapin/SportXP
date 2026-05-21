import { Entity, PrimaryColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from './user.entity';

@Entity('activity_likes')
export class ActivityLike {
  @PrimaryColumn({ name: 'activity_id' })
  activityId: string;

  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
