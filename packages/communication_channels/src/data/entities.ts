import { Entity, PrimaryKey, Property, Index, Unique } from '@mikro-orm/core'

/**
 * Links a Message to an external messaging platform message.
 * Maps internal Message ID to external message IDs from providers like
 * Slack, Telegram, Discord, WhatsApp, etc.
 */
@Entity({ tableName: 'message_channel_links' })
@Index({
  name: 'msg_ch_links_msg_idx',
  properties: ['messageId'],
})
@Index({
  name: 'msg_ch_links_ext_msg_idx',
  properties: ['externalMessageId'],
})
@Index({
  name: 'msg_ch_links_channel_provider_idx',
  properties: ['channelType', 'providerKey'],
})
export class MessageChannelLink {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  // Internal Message ID
  @Property({ name: 'message_id', type: 'uuid' })
  messageId!: string

  // External platform message ID (platform-specific format)
  @Property({ name: 'external_message_id', type: 'text' })
  externalMessageId!: string

  // Channel type: slack, telegram, discord, whatsapp, email, etc.
  @Property({ name: 'channel_type', type: 'text' })
  channelType!: string

  // Provider-specific identifier (workspace ID, bot ID, etc.)
  @Property({ name: 'provider_key', type: 'text', nullable: true })
  providerKey?: string | null

  // Additional platform-specific data (thread ID, metadata, etc.)
  @Property({ name: 'channel_payload', type: 'json', nullable: true })
  channelPayload?: Record<string, any> | null

  // Delivery status: pending, sent, delivered, failed
  @Property({ name: 'delivery_status', type: 'text', default: 'pending' })
  deliveryStatus: string = 'pending'

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

/**
 * Maps an external conversation/thread to an internal Message thread.
 * Used to maintain sync between external chat platforms and internal messaging.
 */
@Entity({ tableName: 'channel_thread_mappings' })
@Index({
  name: 'ch_thr_map_ext_conv_idx',
  properties: ['externalConversationId'],
})
@Index({
  name: 'ch_thr_map_channel_idx',
  properties: ['channelId'],
})
@Index({
  name: 'ch_thr_map_thread_idx',
  properties: ['messageThreadId'],
})
@Index({
  name: 'ch_thr_map_contact_idx',
  properties: ['contactPersonId'],
})
@Index({
  name: 'ch_thr_map_tenant_org_idx',
  properties: ['tenantId', 'organizationId'],
})
@Index({
  name: 'ch_thr_map_last_activity_idx',
  properties: ['lastActivityAt'],
})
export class ChannelThreadMapping {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  // External conversation/thread ID from the provider
  @Property({ name: 'external_conversation_id', type: 'text' })
  externalConversationId!: string

  // Channel identifier (e.g., Slack workspace + channel, Telegram chat ID)
  @Property({ name: 'channel_id', type: 'text' })
  channelId!: string

  // Internal Message thread ID
  @Property({ name: 'message_thread_id', type: 'uuid' })
  messageThreadId!: string

  // Linked CRM contact person ID
  @Property({ name: 'contact_person_id', type: 'uuid', nullable: true })
  contactPersonId?: string | null

  // Tenant scope
  @Property({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string | null

  // Organization scope
  @Property({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId?: string | null

  // Last activity timestamp for sorting/sync
  @Property({ name: 'last_activity_at', type: Date, onCreate: () => new Date() })
  lastActivityAt: Date = new Date()

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}

/**
 * Stores reactions (emoji) on messages from external messaging platforms.
 * Maps to MessageChannelLink to track reactions on synced messages.
 */
@Entity({ tableName: 'message_reactions' })
@Index({
  name: 'msg_rxn_msg_ch_link_idx',
  properties: ['messageChannelLinkId'],
})
@Index({
  name: 'msg_rxn_ext_msg_idx',
  properties: ['externalMessageId'],
})
@Index({
  name: 'msg_rxn_channel_provider_idx',
  properties: ['channelType', 'providerKey'],
})
@Index({
  name: 'msg_rxn_user_idx',
  properties: ['userIdentifier'],
})
@Unique({
  name: 'msg_rxn_unique_user_emoji',
  properties: ['externalMessageId', 'userIdentifier', 'emoji'],
})
export class MessageReaction {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'gen_random_uuid()' })
  id!: string

  // FK to MessageChannelLink
  @Property({ name: 'message_channel_link_id', type: 'uuid' })
  messageChannelLinkId!: string

  // External message ID from the platform
  @Property({ name: 'external_message_id', type: 'text' })
  externalMessageId!: string

  // Emoji (unicode or shortcode like :smile:)
  @Property({ name: 'emoji', type: 'text' })
  emoji!: string

  // Platform user ID (e.g., Slack user ID, Telegram user ID)
  @Property({ name: 'user_identifier', type: 'text' })
  userIdentifier!: string

  // Optional display name from the platform
  @Property({ name: 'user_display_name', type: 'text', nullable: true })
  userDisplayName?: string | null

  // Optional avatar URL from the platform
  @Property({ name: 'user_avatar_url', type: 'text', nullable: true })
  userAvatarUrl?: string | null

  // Channel type: slack, whatsapp, telegram, etc.
  @Property({ name: 'channel_type', type: 'text' })
  channelType!: string

  // Provider-specific identifier (workspace ID, bot ID, etc.)
  @Property({ name: 'provider_key', type: 'text' })
  providerKey!: string

  // When the reaction was added (from platform API)
  @Property({ name: 'timestamp', type: Date, onCreate: () => new Date() })
  timestamp: Date = new Date()

  @Property({ name: 'created_at', type: Date, onCreate: () => new Date() })
  createdAt: Date = new Date()

  @Property({ name: 'updated_at', type: Date, onUpdate: () => new Date() })
  updatedAt: Date = new Date()
}