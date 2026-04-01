import { Migration } from '@mikro-orm/migrations';

export class Migration20260401150000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "message_reactions" (
        "id" uuid not null default gen_random_uuid(),
        "message_channel_link_id" uuid not null,
        "external_message_id" text not null,
        "emoji" text not null,
        "user_identifier" text not null,
        "user_display_name" text null,
        "user_avatar_url" text null,
        "channel_type" text not null,
        "provider_key" text not null,
        "timestamp" timestamptz not null,
        "created_at" timestamptz not null,
        "updated_at" timestamptz not null,
        constraint "message_reactions_pkey" primary key ("id")
      )
    `);

    this.addSql(`create unique index if not exists "message_reactions_user_emoji_idx" on "message_reactions" ("external_message_id", "user_identifier", "emoji")`);
    this.addSql(`create index if not exists "message_reactions_channel_provider_idx" on "message_reactions" ("channel_type", "provider_key")`);
    this.addSql(`create index if not exists "message_reactions_link_idx" on "message_reactions" ("message_channel_link_id")`);
  }
}
