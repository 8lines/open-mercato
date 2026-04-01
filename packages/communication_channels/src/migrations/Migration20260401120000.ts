import { Migration } from '@mikro-orm/migrations';

export class Migration20260401120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "message_channel_links" (
        "id" uuid not null default gen_random_uuid(),
        "message_id" uuid not null,
        "external_message_id" text not null,
        "channel_type" text not null,
        "provider_key" text null,
        "channel_payload" jsonb null,
        "delivery_status" text not null default 'pending',
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "message_channel_links_pkey" primary key ("id")
      )
    `);

    this.addSql(`create unique index if not exists "message_channel_links_external_msg_provider_idx" on "message_channel_links" ("external_message_id", "provider_key")`);
    this.addSql(`create index if not exists "message_channel_links_message_id_idx" on "message_channel_links" ("message_id")`);
    this.addSql(`create index if not exists "message_channel_links_channel_type_idx" on "message_channel_links" ("channel_type")`);
  }
}
