import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../database/entities/user.entity';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface UpsertUserDto {
  stravaId: number;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  city: string;
  region: string;
  country: string;
  stravaAccessToken: string;
  stravaRefreshToken: string;
  tokenExpiresAt: number;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async upsertUser(dto: UpsertUserDto): Promise<User> {
    const adminIds = new Set(
      (this.config.get<string>('ADMIN_STRAVA_IDS') ?? '')
        .split(',').map(s => s.trim()).filter(Boolean),
    );
    const isAdmin = adminIds.has(String(dto.stravaId));

    let user = await this.userRepo.findOne({ where: { stravaId: dto.stravaId } });

    if (user) {
      Object.assign(user, {
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        city: dto.city,
        region: dto.region,
        country: dto.country,
        stravaAccessToken: dto.stravaAccessToken,
        stravaRefreshToken: dto.stravaRefreshToken,
        tokenExpiresAt: dto.tokenExpiresAt,
      });
      if (isAdmin) user.role = UserRole.ADMIN;
      return this.userRepo.save(user);
    }

    user = this.userRepo.create({ ...dto, role: isAdmin ? UserRole.ADMIN : UserRole.ATHLETE });
    return this.userRepo.save(user);
  }

  generateJWT(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      stravaId: user.stravaId,
      role: user.role,
    });
  }

  async refreshStravaToken(user: User): Promise<User> {
    const now = Math.floor(Date.now() / 1000);
    if (user.tokenExpiresAt > now) return user;

    const { data } = await axios.post('https://www.strava.com/oauth/token', {
      client_id: this.config.get('STRAVA_CLIENT_ID'),
      client_secret: this.config.get('STRAVA_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: user.stravaRefreshToken,
    });

    user.stravaAccessToken = data.access_token;
    user.stravaRefreshToken = data.refresh_token;
    user.tokenExpiresAt = data.expires_at;
    return this.userRepo.save(user);
  }
}
