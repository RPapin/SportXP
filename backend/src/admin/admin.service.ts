import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, getLevelFromXP } from '../database/entities/user.entity';
import { Achievement } from '../database/entities/achievement.entity';
import { Activity } from '../database/entities/activity.entity';

const BIKE_SPORTS = new Set(['Ride', 'MountainBikeRide', 'GravelRide']);
const RUN_SPORTS = new Set(['Run', 'TrailRun']);

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Achievement) private achievementRepo: Repository<Achievement>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
  ) {}

  async listUsers() {
    const users = await this.userRepo.find({ order: { xpTotal: 'DESC' } });
    return users.map((u) => ({
      id: u.id,
      stravaId: u.stravaId,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      avatarUrl: u.avatarUrl,
      region: u.region,
      country: u.country,
      xpTotal: u.xpTotal,
      xpRun: u.xpRun,
      xpBike: u.xpBike,
      level: getLevelFromXP(u.xpTotal),
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  async updateUser(id: string, dto: { role?: UserRole; isActive?: boolean; firstName?: string; lastName?: string; region?: string }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    const saved = await this.userRepo.save(user);
    return {
      id: saved.id,
      stravaId: saved.stravaId,
      username: saved.username,
      firstName: saved.firstName,
      lastName: saved.lastName,
      avatarUrl: saved.avatarUrl,
      region: saved.region,
      country: saved.country,
      xpTotal: saved.xpTotal,
      xpRun: saved.xpRun,
      xpBike: saved.xpBike,
      level: getLevelFromXP(saved.xpTotal),
      role: saved.role,
      isActive: saved.isActive,
      createdAt: saved.createdAt,
    };
  }

  async deleteUser(id: string) {
    await this.userRepo.delete(id);
    return { deleted: true };
  }

  async recalculateAllXP(): Promise<{ recalculated: number }> {
    const users = await this.userRepo.find({ relations: { activities: true } });
    for (const user of users) {
      let xpTotal = 0, xpRun = 0, xpBike = 0;
      for (const activity of user.activities) {
        if (!activity.isCounted) continue;
        xpTotal += activity.xpEarned;
        if (BIKE_SPORTS.has(activity.sportType)) xpBike += activity.xpEarned;
        if (RUN_SPORTS.has(activity.sportType)) xpRun += activity.xpEarned;
      }
      await this.userRepo.update(user.id, {
        xpTotal: Math.round(xpTotal),
        xpRun: Math.round(xpRun),
        xpBike: Math.round(xpBike),
      });
    }
    return { recalculated: users.length };
  }

  async getGlobalStats() {
    const [totalUsers, totalActivities] = await Promise.all([
      this.userRepo.count(),
      this.activityRepo.count(),
    ]);
    const xpResult = await this.userRepo
      .createQueryBuilder('u')
      .select('SUM(u.xpTotal)', 'totalXP')
      .getRawOne();

    return {
      totalUsers,
      totalActivities,
      totalXPDistributed: parseInt(xpResult.totalXP ?? '0', 10),
    };
  }

  async listAchievements() {
    return this.achievementRepo.find({ order: { conditionValue: 'ASC' } });
  }

  async createAchievement(dto: any) {
    return this.achievementRepo.save(this.achievementRepo.create(dto));
  }

  async updateAchievement(id: string, dto: any) {
    const achievement = await this.achievementRepo.findOne({ where: { id } });
    if (!achievement) throw new NotFoundException('Achievement not found');
    Object.assign(achievement, dto);
    return this.achievementRepo.save(achievement);
  }

  async deleteAchievement(id: string) {
    await this.achievementRepo.delete(id);
    return { deleted: true };
  }
}
