import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, getLevelFromXP } from '../database/entities/user.entity';
import { Achievement } from '../database/entities/achievement.entity';
import { Activity } from '../database/entities/activity.entity';

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
      region: u.region,
      country: u.country,
      xpTotal: u.xpTotal,
      level: getLevelFromXP(u.xpTotal),
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
    }));
  }

  async updateUser(id: string, dto: { role?: any; isActive?: boolean }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async deleteUser(id: string) {
    await this.userRepo.delete(id);
    return { deleted: true };
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
