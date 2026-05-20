import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('activities')
export class Activity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'bigint', name: 'strava_activity_id' })
  stravaActivityId: number;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (u) => u.activities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true, name: 'sport_type' })
  sportType: string;

  @Column({ type: 'float', default: 0, name: 'distance_m' })
  distanceM: number;

  @Column({ type: 'float', nullable: true, name: 'average_grade_percent' })
  averageGradePercent: number;

  @Column({ type: 'float', default: 0, name: 'xp_earned' })
  xpEarned: number;

  @Column({ type: 'geometry', srid: 4326, nullable: true, spatialFeatureType: 'LineString' })
  polyline: any;

  @Column({ type: 'timestamp', nullable: true, name: 'start_date' })
  startDate: Date;

  @CreateDateColumn({ name: 'synced_at' })
  syncedAt: Date;

  @Column({ type: 'boolean', default: true, name: 'is_counted' })
  isCounted: boolean;
}
