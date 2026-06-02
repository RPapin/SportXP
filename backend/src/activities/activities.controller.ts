import {
  Controller, Get, Param, Post, Query, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { InteractionsService } from '../interactions/interactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('api/activities')
export class ActivitiesController {
  constructor(
    private activitiesService: ActivitiesService,
    private interactionsService: InteractionsService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getFeed(
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
    @Req() req: any,
  ) {
    const userId: string | undefined = req.user?.id;
    const activities = await this.activitiesService.getFeed(+limit, +offset);
    const ids = activities.map((a) => a.id);
    const meta = await this.interactionsService.getFeedMeta(ids, userId);
    return activities.map((a) => ({
      ...a,
      ...(meta.get(a.id) ?? { likesCount: 0, commentsCount: 0, likedByMe: false }),
    }));
  }

  @Get('map')
  getMap(
    @Query('userId') userId?: string,
    @Query('sportType') sportType?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.activitiesService.getMapGeoJSON(
      userId,
      sportType,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMine(@Req() req: any) {
    return this.activitiesService.getUserActivities(req.user.id);
  }

  @Get('user/:id')
  @UseGuards(JwtAuthGuard)
  getUserActivities(@Param('id') id: string) {
    return this.activitiesService.getUserActivities(id);
  }

  @Get('sync-status')
  @UseGuards(JwtAuthGuard)
  syncStatus(@Req() req: any) {
    return this.activitiesService.getSyncStatus(req.user);
  }

  @Post('sync-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  syncAll(@Req() req: any) {
    return this.activitiesService.syncAllActivities(req.user);
  }
}
