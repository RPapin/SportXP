import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Activity } from './entities/activity.entity';
import { XpLog } from './entities/xp-log.entity';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { ActivityLike } from './entities/activity-like.entity';
import { ActivityComment } from './entities/activity-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbUrl = config.get<string>('DATABASE_URL') ?? '';
        return {
          type: 'postgres',
          url: dbUrl,
          entities: [User, Activity, XpLog, Achievement, UserAchievement, ActivityLike, ActivityComment],
          synchronize: process.env.DB_SYNC === 'true',
          migrations: ['dist/database/migrations/*.js'],
          migrationsRun: true,
          logging: false,
          ssl: dbUrl.includes('localhost') || dbUrl.includes('@db:')
            ? false
            : { rejectUnauthorized: false },
          extra: { max: 10 },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
