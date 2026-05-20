import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Activity } from './activity.entity';

@Entity('xp_logs')
export class XpLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.xpLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'activity_id', nullable: true })
  activityId: string;

  @ManyToOne(() => Activity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'activity_id' })
  activity: Activity;

  @Column({ type: 'int', name: 'xp_delta' })
  xpDelta: number;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
