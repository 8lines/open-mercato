import { Migration } from '@mikro-orm/migrations';

export class Migration20260401130000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "channel_thread_mappings" (
        "id" uuid not null default gen_random_uuid(),
        "external_conversation_id" text not null,
        "channel_id" text not null,
        "message_thread_id" uuid not null,
        "tenant_id" uuid null,
        "organization_id" uuid null,
        "last_activity_at" timestamptz not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "channel_thread_mappings_pkey" primary key ("id")
      )
    `);

    this.addSql(`create unique index if not exists "channel_thread_mappings_ext_conv_channel_idx" on "channel_thread_mappings" ("external_conversation_id", "channel_id")`);
    this.addSql(`create index if not exists "channel_thread_mappings_org_tenant_idx" on "channel_thread_mappings" ("organization_id", "tenant_id")`);
  }
}
