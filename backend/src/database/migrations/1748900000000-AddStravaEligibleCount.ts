import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStravaEligibleCount1748900000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "strava_eligible_count" INT
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "strava_eligible_count"
    `);
  }
}
