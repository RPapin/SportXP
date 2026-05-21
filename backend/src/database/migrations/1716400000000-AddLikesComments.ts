import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLikesComments1716400000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_likes" (
        "activity_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_likes" PRIMARY KEY ("activity_id", "user_id"),
        CONSTRAINT "FK_likes_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_likes_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "activity_comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "activity_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "content" text NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comments_activity" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_comments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_likes"`);
  }
}
