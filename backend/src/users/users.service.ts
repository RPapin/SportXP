import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, getLevelFromXP } from '../database/entities/user.entity';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private userRepo: Repository<User>) {}

  async getLeaderboard(region?: string, period?: 'month' | 'global') {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .select(['u.id', 'u.firstName', 'u.lastName', 'u.avatarUrl', 'u.username', 'u.region', 'u.country', 'u.xpTotal'])
      .where('u.isActive = true');

    if (region) qb.andWhere('u.region = :region', { region });

    qb.orderBy('u.xpTotal', 'DESC').limit(100);

    const users = await qb.getMany();
    return users.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      avatarUrl: u.avatarUrl,
      username: u.username,
      region: u.region,
      country: u.country,
      xpTotal: u.xpTotal,
      level: getLevelFromXP(u.xpTotal),
    }));
  }

  async getPublicProfile(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: { activities: true, userAchievements: { achievement: true } },
    });
    if (!user) return null;

    const totalDistance = user.activities.reduce((s, a) => s + a.distanceM, 0);
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      username: user.username,
      city: user.city,
      region: user.region,
      country: user.country,
      xpTotal: user.xpTotal,
      level: getLevelFromXP(user.xpTotal),
      activityCount: user.activities.length,
      totalDistanceM: totalDistance,
      achievements: user.userAchievements.map((ua) => ({
        ...ua.achievement,
        unlockedAt: ua.unlockedAt,
      })),
    };
  }
}
