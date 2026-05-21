import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from '../database/entities/activity.entity';
import { User } from '../database/entities/user.entity';
import { XpLog } from '../database/entities/xp-log.entity';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { WebhookController } from './webhook.controller';
import { AchievementsModule } from '../achievements/achievements.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AuthModule } from '../auth/auth.module';
import { InteractionsModule } from '../interactions/interactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Activity, User, XpLog]),
    AchievementsModule,
    WebsocketModule,
    AuthModule,
    InteractionsModule,
  ],
  controllers: [ActivitiesController, WebhookController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
