import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('strava'))
  stravaAuth() {}

  @Get('strava/callback')
  @UseGuards(AuthGuard('strava'))
  stravaCallback(@Req() req: any, @Res() res: Response) {
    const token = this.authService.generateJWT(req.user);
    const frontendUrl = this.config.get<string>('FRONTEND_URL');
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
