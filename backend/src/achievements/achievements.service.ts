import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, ConditionType } from '../database/entities/achievement.entity';
import { UserAchievement } from '../database/entities/user-achievement.entity';
import { User, getLevelFromXP } from '../database/entities/user.entity';
import { Activity } from '../database/entities/activity.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement) private achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement) private userAchievementRepo: Repository<UserAchievement>,
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
  ) {}

  async checkAndUnlock(user: User): Promise<Achievement[]> {
    const allAchievements = await this.achievementRepo.find();
    const alreadyUnlocked = await this.userAchievementRepo.find({
      where: { userId: user.id },
      select: { achievementId: true },
    });
    const unlockedIds = new Set(alreadyUnlocked.map((ua) => ua.achievementId));

    const [activityCount, distanceResult] = await Promise.all([
      this.activityRepo.count({ where: { userId: user.id, isCounted: true } }),
      this.activityRepo
        .createQueryBuilder('a')
        .select('COALESCE(SUM(a.distanceM), 0)', 'total')
        .where('a.userId = :userId AND a.isCounted = true', { userId: user.id })
        .getRawOne(),
    ]);

    const totalDistance = parseFloat(distanceResult?.total ?? '0');
    const userLevel = getLevelFromXP(user.xpTotal);

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of allAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let unlocked = false;
      switch (achievement.conditionType) {
        case ConditionType.LEVEL:
          unlocked = userLevel >= achievement.conditionValue;
          break;
        case ConditionType.TOTAL_XP:
          unlocked = user.xpTotal >= achievement.conditionValue;
          break;
        case ConditionType.ACTIVITY_COUNT:
          unlocked = activityCount >= achievement.conditionValue;
          break;
        case ConditionType.DISTANCE_TOTAL:
          unlocked = totalDistance >= achievement.conditionValue;
          break;
        case ConditionType.STREAK_DAYS:
          unlocked = await this.checkStreak(user.id, achievement.conditionValue);
          break;
      }

      if (unlocked) {
        await this.userAchievementRepo.save(
          this.userAchievementRepo.create({ userId: user.id, achievementId: achievement.id }),
        );
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  private async checkStreak(userId: string, days: number): Promise<boolean> {
    const activities = await this.activityRepo
      .createQueryBuilder('a')
      .select('DATE(a.startDate)', 'day')
      .where('a.userId = :userId AND a.isCounted = true', { userId })
      .orderBy('day', 'DESC')
      .getRawMany();

    const uniqueDays = [...new Set(activities.map((a) => a.day as string))];
    if (uniqueDays.length < days) return false;

    let streak = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      const prev = new Date(uniqueDays[i - 1]);
      const curr = new Date(uniqueDays[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
        if (streak >= days) return true;
      } else {
        streak = 1;
      }
    }
    return streak >= days;
  }

  async seedDefaultAchievements(): Promise<void> {
    const defaults = [
      { code: 'first_activity', name: 'Premier pas', description: 'Synchronise ta première activité', conditionType: ConditionType.ACTIVITY_COUNT, conditionValue: 1 },
      { code: 'level_5', name: 'Apprenti grimpeur', description: 'Atteins le niveau 5', conditionType: ConditionType.LEVEL, conditionValue: 5 },
      { code: 'level_10', name: 'Randonneur confirmé', description: 'Atteins le niveau 10', conditionType: ConditionType.LEVEL, conditionValue: 10 },
      { code: 'level_25', name: 'Explorateur', description: 'Atteins le niveau 25', conditionType: ConditionType.LEVEL, conditionValue: 25 },
      { code: 'xp_1000', name: 'Millionnaire XP', description: 'Accumule 1000 XP', conditionType: ConditionType.TOTAL_XP, conditionValue: 1000 },
      { code: 'xp_10000', name: 'Elite', description: 'Accumule 10 000 XP', conditionType: ConditionType.TOTAL_XP, conditionValue: 10000 },
      { code: 'distance_100km', name: 'Centurion', description: 'Parcours 100 km au total', conditionType: ConditionType.DISTANCE_TOTAL, conditionValue: 100000 },
      { code: 'distance_1000km', name: 'Globe-trotter', description: 'Parcours 1000 km au total', conditionType: ConditionType.DISTANCE_TOTAL, conditionValue: 1000000 },
      { code: 'streak_7', name: 'Semaine parfaite', description: '7 activités sur 7 jours différents', conditionType: ConditionType.STREAK_DAYS, conditionValue: 7 },
    ];

    for (const d of defaults) {
      const exists = await this.achievementRepo.findOne({ where: { code: d.code } });
      if (!exists) {
        await this.achievementRepo.save(this.achievementRepo.create(d));
      }
    }
  }
}
