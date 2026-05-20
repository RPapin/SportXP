import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { Achievement } from '../database/entities/achievement.entity';
import { Activity } from '../database/entities/activity.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Achievement, Activity])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
