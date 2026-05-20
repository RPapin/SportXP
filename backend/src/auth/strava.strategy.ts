import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import axios from 'axios';

@Injectable()
export class StravaStrategy extends PassportStrategy(Strategy, 'strava') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      authorizationURL: 'https://www.strava.com/oauth/authorize',
      tokenURL: 'https://www.strava.com/oauth/token',
      clientID: config.get<string>('STRAVA_CLIENT_ID') as string,
      clientSecret: config.get<string>('STRAVA_CLIENT_SECRET') as string,
      callbackURL: `${config.get<string>('API_URL') as string}/api/auth/strava/callback`,
      scope: 'activity:read_all',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    params: any,
    _profile: any,
  ): Promise<any> {
    const tokenExpiresAt: number = params.expires_at;

    const { data: athlete } = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    return this.authService.upsertUser({
      stravaId: athlete.id,
      username: athlete.username,
      firstName: athlete.firstname,
      lastName: athlete.lastname,
      avatarUrl: athlete.profile,
      city: athlete.city,
      region: athlete.state,
      country: athlete.country,
      stravaAccessToken: accessToken,
      stravaRefreshToken: refreshToken,
      tokenExpiresAt,
    });
  }
}
