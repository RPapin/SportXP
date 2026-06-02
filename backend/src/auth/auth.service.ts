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

  getKeyConfig(slot: number): { clientId: string; clientSecret: string } {
    const clientId = this.config.get<string>(`STRAVA_CLIENT_ID_${slot}`);
    const clientSecret = this.config.get<string>(`STRAVA_CLIENT_SECRET_${slot}`);
    if (!clientId || !clientSecret) {
      throw new Error(`Strava key slot ${slot} not configured`);
    }
    return { clientId, clientSecret };
  }

  async getAvailableSlot(slotHint?: number): Promise<number | null> {
    // Returning users provide a hint — trust it directly
    if (slotHint && slotHint >= 1 && slotHint <= 4) return slotHint;

    const counts = await this.userRepo
      .createQueryBuilder('u')
      .select('u.stravaKeySlot', 'slot')
      .addSelect('COUNT(*)', 'count')
      .where('u.stravaKeySlot IS NOT NULL')
      .groupBy('u.stravaKeySlot')
      .getRawMany();

    const countMap = new Map<number, number>();
    for (const row of counts) {
      countMap.set(Number(row.slot), Number(row.count));
    }

    for (let slot = 1; slot <= 4; slot++) {
      if ((countMap.get(slot) ?? 0) < 10) return slot;
    }
    return null;
  }

  async handleStravaCallback(code: string, slot: number): Promise<User> {
    const { clientId, clientSecret } = this.getKeyConfig(slot);

    const { data } = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code',
    });

    const athlete = data.athlete;

    return this.upsertUser(
      {
        stravaId: athlete.id,
        username: athlete.username,
        firstName: athlete.firstname,
        lastName: athlete.lastname,
        avatarUrl: athlete.profile,
        city: athlete.city,
        region: athlete.state,
        country: athlete.country,
        stravaAccessToken: data.access_token,
        stravaRefreshToken: data.refresh_token,
        tokenExpiresAt: data.expires_at,
      },
      slot,
    );
  }

  async upsertUser(dto: UpsertUserDto, slot?: number): Promise<User> {
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
      // Assign slot if it was never set (e.g. existing users before migration)
      if (!user.stravaKeySlot && slot) user.stravaKeySlot = slot;
      return this.userRepo.save(user);
    }

    user = this.userRepo.create({
      ...dto,
      role: isAdmin ? UserRole.ADMIN : UserRole.ATHLETE,
      stravaKeySlot: slot,
    });
    return this.userRepo.save(user);
  }

  generateJWT(user: User): string {
    return this.jwtService.sign({
      sub: user.id,
      stravaId: user.stravaId,
      role: user.role,
      stravaKeySlot: user.stravaKeySlot,
    });
  }

  async refreshStravaToken(user: User): Promise<User> {
    const now = Math.floor(Date.now() / 1000);
    if (user.tokenExpiresAt > now) return user;

    // Fall back to slot 1 for users created before this feature
    const slot = user.stravaKeySlot ?? 1;
    const { clientId, clientSecret } = this.getKeyConfig(slot);

    const { data } = await axios.post('https://www.strava.com/oauth/token', {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: user.stravaRefreshToken,
    });

    user.stravaAccessToken = data.access_token;
    user.stravaRefreshToken = data.refresh_token;
    user.tokenExpiresAt = data.expires_at;
    return this.userRepo.save(user);
  }
}
