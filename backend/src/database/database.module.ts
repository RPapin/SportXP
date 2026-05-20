import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Activity } from './entities/activity.entity';
import { XpLog } from './entities/xp-log.entity';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [User, Activity, XpLog, Achievement, UserAchievement],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: false,
        extra: {
          max: 10,
        },
      }),
    }),
  ],
})
export class DatabaseModule {}
