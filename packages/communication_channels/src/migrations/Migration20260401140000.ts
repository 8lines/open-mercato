import { Migration } from '@mikro-orm/migrations';

export class Migration20260401140000 extends Migration {

  override async up(): Promise<void> {
    // Add capabilities column to communication_channels table
    // Uses IF NOT EXISTS pattern for safety
    this.addSql(`
      DO $$ 
      BEGIN 
        ALTER TABLE "communication_channels" ADD COLUMN "capabilities" jsonb null; 
      EXCEPTION 
        WHEN duplicate_column THEN NULL; 
      END $$;
    `);
  }
}
