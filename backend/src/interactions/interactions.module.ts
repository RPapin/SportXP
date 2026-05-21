import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLike } from '../database/entities/activity-like.entity';
import { ActivityComment } from '../database/entities/activity-comment.entity';
import { InteractionsService } from './interactions.service';
import { InteractionsController } from './interactions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLike, ActivityComment])],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService],
})
export class InteractionsModule {}
