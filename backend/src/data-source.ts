import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './database/entities/user.entity';
import { Activity } from './database/entities/activity.entity';
import { XpLog } from './database/entities/xp-log.entity';
import { Achievement } from './database/entities/achievement.entity';
import { UserAchievement } from './database/entities/user-achievement.entity';
import { ActivityLike } from './database/entities/activity-like.entity';
import { ActivityComment } from './database/entities/activity-comment.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [User, Activity, XpLog, Achievement, UserAchievement, ActivityLike, ActivityComment],
  migrations: ['src/database/migrations/*.ts'],
  ssl: process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});
