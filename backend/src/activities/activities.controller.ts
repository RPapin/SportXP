import {
  Controller, Get, Post, Query, Req, UseGuards, HttpCode,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  getFeed(
    @Query('limit') limit = '20',
    @Query('offset') offset = '0',
  ) {
    return this.activitiesService.getFeed(+limit, +offset);
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

  @Post('sync-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  syncAll(@Req() req: any) {
    return this.activitiesService.syncAllActivities(req.user);
  }
}
