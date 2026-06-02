import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStravaKeySlot1748800000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN IF NOT EXISTS "strava_key_slot" integer
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN IF EXISTS "strava_key_slot"
    `);
  }
}
