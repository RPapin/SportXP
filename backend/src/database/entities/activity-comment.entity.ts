import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Activity } from './activity.entity';
import { User } from './user.entity';

@Entity('activity_comments')
export class ActivityComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'activity_id' })
  activityId: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column('text')
  content: string;

  @ManyToOne(() => Activity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
