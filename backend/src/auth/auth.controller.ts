import { Controller, Get, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Response } from 'express';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private config: ConfigService,
  ) {}

  @Get('strava')
  async stravaAuth(@Query('slot') slotQuery: string, @Res() res: Response) {
    const slotHint = slotQuery ? parseInt(slotQuery, 10) : undefined;
    const slot = await this.authService.getAvailableSlot(slotHint);

    if (!slot) {
      const frontendUrl = (this.config.get<string>('FRONTEND_URL') ?? '').split(',')[0].trim();
      return res.redirect(`${frontendUrl}/auth/error?reason=capacity`);
    }

    const { clientId } = this.authService.getKeyConfig(slot);
    const apiUrl = this.config.get<string>('API_URL');
    const callbackUrl = `${apiUrl}/api/auth/strava/${slot}/callback`;

    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', callbackUrl);
    authUrl.searchParams.set('scope', 'activity:read_all');
    authUrl.searchParams.set('approval_prompt', 'auto');

    return res.redirect(authUrl.toString());
  }

  @Get('strava/:slot/callback')
  async stravaCallback(
    @Param('slot') slotParam: string,
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = (this.config.get<string>('FRONTEND_URL') ?? '').split(',')[0].trim();

    if (error || !code) {
      return res.redirect(`${frontendUrl}/auth/error?reason=denied`);
    }

    const slot = parseInt(slotParam, 10);
    if (isNaN(slot) || slot < 1 || slot > 4) {
      return res.redirect(`${frontendUrl}/auth/error`);
    }

    const apiUrl = this.config.get<string>('API_URL');
    const redirectUri = `${apiUrl}/api/auth/strava/${slot}/callback`;

    const user = await this.authService.handleStravaCallback(code, slot, redirectUri);
    const token = this.authService.generateJWT(user);
    return res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: any) {
    const user = req.user;
    return {
      id: user.id,
      stravaId: user.stravaId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      city: user.city,
      region: user.region,
      country: user.country,
      xpTotal: user.xpTotal,
      level: user.level,
      role: user.role,
    };
  }
}
