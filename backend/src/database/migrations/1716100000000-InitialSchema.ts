import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1716100000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    // Extension PostGIS (requise pour les colonnes geometry)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis`);

    // Enum rôle utilisateur
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "users_role_enum" AS ENUM ('athlete', 'admin');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // Enum type de condition achievement
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "achievements_condition_type_enum"
          AS ENUM ('level', 'total_xp', 'activity_count', 'distance_total', 'streak_days');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$
    `);

    // Table users (inclut déjà xp_run / xp_bike pour éviter le conflit avec AddXpRunXpBike)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id"                   uuid         NOT NULL DEFAULT gen_random_uuid(),
        "strava_id"            bigint        NOT NULL,
        "username"             varchar,
        "first_name"           varchar,
        "last_name"            varchar,
        "avatar_url"           varchar,
        "city"                 varchar,
        "region"               varchar,
        "country"              varchar,
        "xp_total"             integer       NOT NULL DEFAULT 0,
        "xp_run"               integer       NOT NULL DEFAULT 0,
        "xp_bike"              integer       NOT NULL DEFAULT 0,
        "strava_access_token"  text,
        "strava_refresh_token" text,
        "token_expires_at"     bigint,
        "role"                 "users_role_enum" NOT NULL DEFAULT 'athlete',
        "is_active"            boolean       NOT NULL DEFAULT true,
        "created_at"           TIMESTAMP     NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users"            PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_strava_id"  UNIQUE ("strava_id")
      )
    `);

    // Table activities (polyline = geometry PostGIS)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activities" (
        "id"                    uuid             NOT NULL DEFAULT gen_random_uuid(),
        "strava_activity_id"    bigint            NOT NULL,
        "user_id"               uuid             NOT NULL,
        "name"                  varchar,
        "sport_type"            varchar,
        "distance_m"            double precision  NOT NULL DEFAULT 0,
        "average_grade_percent" double precision,
        "xp_earned"             double precision  NOT NULL DEFAULT 0,
        "polyline"              geometry(LineString,4326),
        "start_date"            TIMESTAMP,
        "synced_at"             TIMESTAMP         NOT NULL DEFAULT now(),
        "is_counted"            boolean           NOT NULL DEFAULT true,
        CONSTRAINT "PK_activities"         PRIMARY KEY ("id"),
        CONSTRAINT "UQ_activities_strava"  UNIQUE ("strava_activity_id"),
        CONSTRAINT "FK_activities_user"    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_activities_user_id" ON "activities" ("user_id")
    `);

    // Table xp_logs
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "xp_logs" (
        "id"          uuid     NOT NULL DEFAULT gen_random_uuid(),
        "user_id"     uuid     NOT NULL,
        "activity_id" uuid,
        "xp_delta"    integer  NOT NULL,
        "reason"      varchar(255) NOT NULL,
        "created_at"  TIMESTAMP    NOT NULL DEFAULT now(),
        CONSTRAINT "PK_xp_logs"          PRIMARY KEY ("id"),
        CONSTRAINT "FK_xp_logs_user"     FOREIGN KEY ("user_id")     REFERENCES "users"("id")      ON DELETE CASCADE,
        CONSTRAINT "FK_xp_logs_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE SET NULL
      )
    `);

    // Table achievements
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "achievements" (
        "id"              uuid     NOT NULL DEFAULT gen_random_uuid(),
        "code"            varchar  NOT NULL,
        "name"            varchar  NOT NULL,
        "description"     text,
        "icon_url"        varchar,
        "xp_threshold"    integer,
        "condition_type"  "achievements_condition_type_enum" NOT NULL,
        "condition_value" integer  NOT NULL,
        CONSTRAINT "PK_achievements"      PRIMARY KEY ("id"),
        CONSTRAINT "UQ_achievements_code" UNIQUE ("code")
      )
    `);

    // Table user_achievements
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_achievements" (
        "user_id"        uuid      NOT NULL,
        "achievement_id" uuid      NOT NULL,
        "unlocked_at"    TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_achievements" PRIMARY KEY ("user_id", "achievement_id"),
        CONSTRAINT "FK_ua_user"           FOREIGN KEY ("user_id")        REFERENCES "users"("id")        ON DELETE CASCADE,
        CONSTRAINT "FK_ua_achievement"    FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_achievements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "xp_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "achievements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activities"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "achievements_condition_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_role_enum"`);
  }
}
