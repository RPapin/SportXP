import {
  Controller, Get, Post, Body, Query, Res, HttpCode,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ActivitiesService } from './activities.service';
import type { Response } from 'express';

@Controller('api/webhooks/strava')
export class WebhookController {
  constructor(
    private config: ConfigService,
    private activitiesService: ActivitiesService,
  ) {}

  @Get()
  hubChallenge(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token === this.config.get('STRAVA_WEBHOOK_VERIFY_TOKEN')) {
      return res.json({ 'hub.challenge': challenge });
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  @Post()
  @HttpCode(200)
  async handleEvent(@Body() body: any) {
    if (body.object_type === 'activity' && body.aspect_type === 'create') {
      this.activitiesService
        .importSingleActivity(body.object_id, body.owner_id)
        .catch((err) => console.error('Webhook import error:', err));
    }
    return { status: 'ok' };
  }
}
