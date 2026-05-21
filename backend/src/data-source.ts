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


const dbUrl = process.env.DATABASE_URL ?? '';
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  entities: [User, Activity, XpLog, Achievement, UserAchievement, ActivityLike, ActivityComment],
  migrations: ['src/database/migrations/*.ts'],
  ssl:  dbUrl.includes('localhost') || dbUrl.includes('@db:')
      ? false
      : { rejectUnauthorized: false },
});
