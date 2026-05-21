import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ActivitiesModule } from './activities/activities.module';
import { UsersModule } from './users/users.module';
import { AchievementsModule } from './achievements/achievements.module';
import { AdminModule } from './admin/admin.module';
import { WebsocketModule } from './websocket/websocket.module';
import { InteractionsModule } from './interactions/interactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ActivitiesModule,
    UsersModule,
    AchievementsModule,
    AdminModule,
    WebsocketModule,
    InteractionsModule,
  ],
})
export class AppModule {}
