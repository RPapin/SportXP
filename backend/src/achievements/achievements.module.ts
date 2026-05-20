import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from '../database/entities/achievement.entity';
import { UserAchievement } from '../database/entities/user-achievement.entity';
import { Activity } from '../database/entities/activity.entity';
import { AchievementsService } from './achievements.service';

@Module({
  imports: [TypeOrmModule.forFeature([Achievement, UserAchievement, Activity])],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
