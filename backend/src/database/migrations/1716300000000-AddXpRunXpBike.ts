import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddXpRunXpBike1716300000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp_run" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "xp_bike" integer NOT NULL DEFAULT 0`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "xp_run"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "xp_bike"`);
  }
}
