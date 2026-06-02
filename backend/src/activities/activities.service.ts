import { HttpException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Activity } from '../database/entities/activity.entity';
import { User } from '../database/entities/user.entity';
import { XpLog } from '../database/entities/xp-log.entity';
import { AchievementsService } from '../achievements/achievements.service';
import { EventsGateway } from '../websocket/events.gateway';
import { AuthService } from '../auth/auth.service';
import { calculateXP } from './xp.calculator';
import axios from 'axios';

const ALLOWED_SPORT_TYPES = new Set([
  'Ride', 'MountainBikeRide', 'GravelRide',
  'Run', 'TrailRun',
]);

const SYNC_BATCH_SIZE = 190;
const SYNC_COOLDOWN_MS = 15 * 60 * 1000;

const BIKE_SPORT_TYPES = new Set(['Ride', 'MountainBikeRide', 'GravelRide']);
const RUN_SPORT_TYPES = new Set(['Run', 'TrailRun']);

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectRepository(Activity) private activityRepo: Repository<Activity>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(XpLog) private xpLogRepo: Repository<XpLog>,
    private achievementsService: AchievementsService,
    private eventsGateway: EventsGateway,
    private authService: AuthService,
    private dataSource: DataSource,
  ) {}

  async importSingleActivity(stravaActivityId: number, stravaOwnerId: number): Promise<void> {
    const exists = await this.activityRepo.findOne({ where: { stravaActivityId } });
    if (exists) return;

    const user = await this.userRepo.findOne({ where: { stravaId: stravaOwnerId } });
    if (!user) {
      this.logger.warn(`User with stravaId ${stravaOwnerId} not found`);
      return;
    }

    const freshUser = await this.authService.refreshStravaToken(user);
    const { data: stravaActivity } = await axios.get(
      `https://www.strava.com/api/v3/activities/${stravaActivityId}`,
      { headers: { Authorization: `Bearer ${freshUser.stravaAccessToken}` } },
    );

    if (!ALLOWED_SPORT_TYPES.has(stravaActivity.sport_type)) return;

    await this.saveActivity(freshUser, stravaActivity);
  }

  getSyncStatus(user: User): { canSync: boolean; secondsUntilSync: number } {
    if (!user.lastSyncAt) return { canSync: true, secondsUntilSync: 0 };
    const elapsed = Date.now() - new Date(user.lastSyncAt).getTime();
    const remaining = SYNC_COOLDOWN_MS - elapsed;
    if (remaining <= 0) return { canSync: true, secondsUntilSync: 0 };
    return { canSync: false, secondsUntilSync: Math.ceil(remaining / 1000) };
  }

  async syncAllActivities(user: User): Promise<{ imported: number; skipped: number; remaining: number }> {
    // Enforce 15-minute cooldown
    const status = this.getSyncStatus(user);
    if (!status.canSync) {
      throw new HttpException(
        { message: 'Rate limit', secondsUntilSync: status.secondsUntilSync },
        429,
      );
    }

    // Mark sync start time immediately to prevent concurrent calls
    await this.userRepo.update(user.id, { lastSyncAt: new Date() });

    const freshUser = await this.authService.refreshStravaToken(user);

    // 1. Récupérer toute la liste des activités
    const allActivities: any[] = [];
    let page = 1;
    while (true) {
      const { data } = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: { Authorization: `Bearer ${freshUser.stravaAccessToken}` },
        params: { per_page: 200, page },
      });
      if (!data.length) break;
      allActivities.push(...data);
      if (data.length < 200) break;
      page++;
    }

    // 2. Filtrer par sport autorisé
    const eligible = allActivities.filter(a => ALLOWED_SPORT_TYPES.has(a.sport_type));

    // 3. Identifier en une seule requête celles déjà importées
    const eligibleIds = eligible.map(a => a.id);

    if (eligibleIds.length === 0) {
      this.eventsGateway.emitSyncStart(user.id, 0);
      this.eventsGateway.emitSyncDone(user.id, 0, allActivities.length, 0);
      return { imported: 0, skipped: allActivities.length, remaining: 0 };
    }

    const existing = await this.activityRepo
      .createQueryBuilder('a')
      .select('a.stravaActivityId')
      .where('a.stravaActivityId IN (:...ids)', { ids: eligibleIds })
      .getMany();
    const existingIds = new Set(existing.map(a => Number(a.stravaActivityId)));
    const toImport = eligible.filter(a => !existingIds.has(a.id));
    const skipped = allActivities.length - toImport.length;

    // 4. Cap at SYNC_BATCH_SIZE — remaining will be importable after the cooldown
    const batch = toImport.slice(0, SYNC_BATCH_SIZE);
    const remaining = toImport.length - batch.length;

    this.eventsGateway.emitSyncStart(user.id, batch.length);

    // 5. Importer avec progression en temps réel
    let imported = 0;
    for (const activity of batch) {
      const { data: detailed } = await axios.get(
        `https://www.strava.com/api/v3/activities/${activity.id}`,
        { headers: { Authorization: `Bearer ${freshUser.stravaAccessToken}` } },
      );
      await this.saveActivity(freshUser, detailed);
      imported++;
      this.eventsGateway.emitSyncProgress(user.id, imported, batch.length);
    }

    this.eventsGateway.emitSyncDone(user.id, imported, skipped, remaining);
    return { imported, skipped, remaining };
  }

  private async saveActivity(user: User, stravaData: any): Promise<Activity | null> {
    const distanceM: number = stravaData.distance ?? 0;
    if (distanceM === 0) return null;
    const gradePercent: number | null = stravaData.average_grade_percent ?? null;

    const polylineData = stravaData.map?.polyline
      ? this.buildPolylineData(stravaData.map.polyline)
      : null;

    const newDistanceM = polylineData
      ? await this.computeNewDistance(user.id, polylineData.geoJSON)
      : 0;

    const xpEarned = Math.round(calculateXP(newDistanceM, gradePercent));
    const polyline = polylineData?.postgisFunc ?? null;

    const activity = new Activity();
    activity.stravaActivityId = stravaData.id;
    activity.userId = user.id;
    activity.name = stravaData.name;
    activity.sportType = stravaData.sport_type;
    activity.distanceM = distanceM;
    activity.averageGradePercent = gradePercent as number;
    activity.xpEarned = xpEarned;
    activity.polyline = polyline;
    activity.startDate = stravaData.start_date ? new Date(stravaData.start_date) : (null as unknown as Date);

    const sportType: string = stravaData.sport_type;
    const isBike = BIKE_SPORT_TYPES.has(sportType);
    const isRun = RUN_SPORT_TYPES.has(sportType);

    await this.dataSource.transaction(async (manager) => {
      await manager.save(activity);
      await manager.increment(User, { id: user.id }, 'xpTotal', xpEarned);
      if (isBike) await manager.increment(User, { id: user.id }, 'xpBike', xpEarned);
      if (isRun) await manager.increment(User, { id: user.id }, 'xpRun', xpEarned);
      await manager.save(
        manager.create(XpLog, {
          userId: user.id,
          activityId: activity.id,
          xpDelta: xpEarned,
          reason: `Activité: ${stravaData.name}`,
        }),
      );
    });

    const updatedUser = await this.userRepo.findOne({ where: { id: user.id } });
    const newAchievements = updatedUser
      ? await this.achievementsService.checkAndUnlock(updatedUser)
      : [];

    this.eventsGateway.emitNewActivity({
      id: activity.id,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      avatarUrl: user.avatarUrl,
      name: activity.name,
      sportType: activity.sportType,
      distanceM: activity.distanceM,
      xpEarned: activity.xpEarned,
      startDate: activity.startDate,
    });

    for (const achievement of newAchievements) {
      this.eventsGateway.emitAchievementUnlocked(user.id, achievement);
    }
    console.log('Nouvelle activité sauvegardé :', activity.name)
    return activity;
  }

  private buildPolylineData(encoded: string): { geoJSON: object; postgisFunc: () => string } | null {
    const coords = this.decodePolyline(encoded);
    if (coords.length < 2) return null;
    const geoJSON = {
      type: 'LineString',
      coordinates: coords.map(([lat, lng]) => [lng, lat]),
    };
    return {
      geoJSON,
      postgisFunc: () => `ST_GeomFromGeoJSON('${JSON.stringify(geoJSON)}')`,
    };
  }

  private async computeNewDistance(userId: string, geoJSON: object): Promise<number> {
    const rows = await this.dataSource.query(
      `WITH new_route AS (
         SELECT ST_SetSRID(ST_GeomFromGeoJSON($1), 4326) AS geom
       ),
       explored_union AS (
         SELECT ST_Union(ST_Buffer(polyline::geography, 15)::geometry) AS zone
         FROM activities
         WHERE user_id = $2 AND polyline IS NOT NULL
       ),
       new_portion AS (
         SELECT CASE
           WHEN (SELECT zone FROM explored_union) IS NULL
             THEN (SELECT geom FROM new_route)
           ELSE ST_Difference(
             (SELECT geom FROM new_route),
             (SELECT zone FROM explored_union)
           )
         END AS geom
       )
       SELECT COALESCE(ST_Length((SELECT geom FROM new_portion)::geography), 0) AS new_distance_m`,
      [JSON.stringify(geoJSON), userId],
    );
    return parseFloat(rows[0]?.new_distance_m ?? '0');
  }

  private decodePolyline(encoded: string): [number, number][] {
    const coords: [number, number][] = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
      let shift = 0, result = 0, byte: number;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lat += result & 1 ? ~(result >> 1) : result >> 1;

      shift = 0; result = 0;
      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);
      lng += result & 1 ? ~(result >> 1) : result >> 1;

      coords.push([lat / 1e5, lng / 1e5]);
    }
    return coords;
  }

  async getFeed(limit = 20, offset = 0) {
    const rows = await this.activityRepo
      .createQueryBuilder('a')
      .select(['a.id', 'a.name', 'a.sportType', 'a.distanceM', 'a.xpEarned', 'a.startDate', 'a.isCounted'])
      .addSelect('ST_AsGeoJSON(a.polyline)::json', 'geojson')
      .leftJoin('a.user', 'u')
      .addSelect(['u.id', 'u.firstName', 'u.lastName', 'u.avatarUrl'])
      .where('a.isCounted = true')
      .orderBy('a.startDate', 'DESC')
      .limit(limit)
      .offset(offset)
      .getRawMany();

    return rows.map(r => ({
      id: r.a_id,
      name: r.a_name,
      sportType: r.a_sport_type,
      distanceM: r.a_distance_m,
      xpEarned: r.a_xp_earned,
      startDate: r.a_start_date,
      geojson: r.geojson,
      user: {
        id: r.u_id,
        firstName: r.u_first_name,
        lastName: r.u_last_name,
        avatarUrl: r.u_avatar_url,
      },
    }));
  }

  async getMapGeoJSON(userId?: string, sportType?: string, from?: Date, to?: Date) {
    const qb = this.activityRepo
      .createQueryBuilder('a')
      .select([
        'a.id', 'a.name', 'a.sportType', 'a.distanceM', 'a.xpEarned', 'a.startDate',
        'a.userId',
        'ST_AsGeoJSON(a.polyline)::json as geojson',
      ])
      .leftJoin('a.user', 'u')
      .addSelect(['u.firstName', 'u.lastName', 'u.avatarUrl'])
      .where('a.isCounted = true AND a.polyline IS NOT NULL');

    if (userId) qb.andWhere('a.userId = :userId', { userId });
    if (sportType) qb.andWhere('a.sportType = :sportType', { sportType });
    if (from) qb.andWhere('a.startDate >= :from', { from });
    if (to) qb.andWhere('a.startDate <= :to', { to });

    return qb.getRawMany();
  }

  async getUserActivities(userId: string) {
    return this.activityRepo.find({
      where: { userId, isCounted: true },
      order: { startDate: 'DESC' },
    });
  }
}
