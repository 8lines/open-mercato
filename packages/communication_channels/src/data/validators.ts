import { z } from 'zod'

// Channel types
export const CHANNEL_TYPES = [
  'slack',
  'telegram',
  'discord',
  'whatsapp',
  'email',
  'sms',
  'webhook',
  'msteams',
] as const

export type ChannelType = (typeof CHANNEL_TYPES)[number]

// Delivery statuses
export const DELIVERY_STATUSES = ['pending', 'sent', 'delivered', 'failed'] as const
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number]

// Validators for MessageChannelLink
export const messageChannelLinkSchema = z.object({
  id: z.string().uuid().optional(),
  messageId: z.string().uuid(),
  externalMessageId: z.string().min(1).max(500),
  channelType: z.enum(CHANNEL_TYPES),
  providerKey: z.string().max(200).optional().nullable(),
  channelPayload: z.record(z.unknown()).optional().nullable(),
  deliveryStatus: z.enum(DELIVERY_STATUSES).default('pending'),
})

export const createMessageChannelLinkSchema = messageChannelLinkSchema.omit({ id: true })

export const updateMessageChannelLinkSchema = messageChannelLinkSchema.partial().extend({
  id: z.string().uuid(),
})

// Validators for ChannelThreadMapping
export const channelThreadMappingSchema = z.object({
  id: z.string().uuid().optional(),
  externalConversationId: z.string().min(1).max(500),
  channelId: z.string().min(1).max(200),
  messageThreadId: z.string().uuid(),
  contactPersonId: z.string().uuid().optional().nullable(),
  tenantId: z.string().uuid().optional().nullable(),
  organizationId: z.string().uuid().optional().nullable(),
  lastActivityAt: z.date().optional(),
})

export const createChannelThreadMappingSchema = channelThreadMappingSchema.omit({ id: true })

export const updateChannelThreadMappingSchema = channelThreadMappingSchema.partial().extend({
  id: z.string().uuid(),
})

// Validators for MessageReaction
export const messageReactionSchema = z.object({
  id: z.string().uuid().optional(),
  messageChannelLinkId: z.string().uuid(),
  externalMessageId: z.string().min(1).max(500),
  emoji: z.string().min(1).max(100),
  userIdentifier: z.string().min(1).max(200),
  userDisplayName: z.string().max(200).optional().nullable(),
  userAvatarUrl: z.string().url().max(500).optional().nullable(),
  channelType: z.enum(CHANNEL_TYPES),
  providerKey: z.string().max(200),
  timestamp: z.date(),
})

export const createMessageReactionSchema = messageReactionSchema.omit({ id: true })

export const updateMessageReactionSchema = createMessageReactionSchema.partial().extend({
  id: z.string().uuid(),
})

// Type exports
export type CreateMessageChannelLinkInput = z.infer<typeof createMessageChannelLinkSchema>
export type UpdateMessageChannelLinkInput = z.infer<typeof updateMessageChannelLinkSchema>
export type CreateChannelThreadMappingInput = z.infer<typeof createChannelThreadMappingSchema>
export type UpdateChannelThreadMappingInput = z.infer<typeof updateChannelThreadMappingSchema>
export type CreateMessageReactionInput = z.infer<typeof createMessageReactionSchema>
export type UpdateMessageReactionInput = z.infer<typeof updateMessageReactionSchema>