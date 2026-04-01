/**
 * Outbound Delivery Subscriber
 *
 * Listens for `messages.message.sent` events and triggers outbound delivery
 * to external channels (Slack, Telegram, Discord, WhatsApp, etc.) via MessageChannelLink.
 *
 * Event: messages.message.sent
 */

import { EntityManager } from '@mikro-orm/core'
import type { SubscriberDescriptor, SubscriberContext, EventPayload } from '@open-mercato/events'
import { MessageChannelLink } from '../data/entities.js'
import { Message } from '@open-mercato/core/modules/messages/data/entities.js'
import { getAdapter, isChannelAdapterV2 } from '../lib/registry.js'
import type { OutboundMessage, ConvertOutboundInput, SendMessageResult } from '../lib/types.js'

// ============================================================================
// Event Types
// ============================================================================

/**
 * Payload for messages.message.sent event
 */
export interface MessageSentEvent {
  /** Internal Message ID */
  messageId: string
  /** Tenant ID */
  tenantId: string
  /** Organization ID */
  organizationId: string
  /** Message sender user ID */
  senderUserId: string
  /** Message body */
  body: string
  /** Message body format */
  bodyFormat: 'text' | 'markdown'
  /** Thread ID (if any) */
  threadId?: string | null
  /** Subject (first line of body) */
  subject: string
  /** Message type */
  type: string
}

// ============================================================================
// Retry Configuration
// ============================================================================

const MAX_RETRIES = 3
const INITIAL_BACKOFF_MS = 1000 // 1 second

// ============================================================================
// Main Handler
// ============================================================================

/**
 * Handle messages.message.sent event
 *
 * Finds all MessageChannelLinks for the message and delivers to each external channel.
 *
 * @param payload - Event payload
 * @param ctx - Subscriber context
 */
export async function onMessageSent(
  payload: EventPayload,
  ctx: SubscriberContext
): Promise<void> {
  const event = payload as MessageSentEvent

  console.log(`[outbound-delivery] Processing message ${event.messageId} (tenant: ${event.tenantId})`)

  // 1. Get EntityManager from DI container
  const em = ctx.resolve<EntityManager>('entityManager')
  if (!em) {
    console.error('[outbound-delivery] No EntityManager found in context')
    throw new Error('EntityManager not found in subscriber context')
  }

  // 2. Find channel links for this message
  const channelLinks = await findChannelLinksForMessage(em, event.messageId)

  if (channelLinks.length === 0) {
    console.log(`[outbound-delivery] No channel links for message ${event.messageId}, skipping`)
    return
  }

  console.log(`[outbound-delivery] Found ${channelLinks.length} channel link(s) for message ${event.messageId}`)

  // 3. Create OutboundMessage from event payload
  const outboundMessage: OutboundMessage = {
    body: event.body,
    bodyFormat: event.bodyFormat,
    threadId: event.threadId ?? undefined,
  }

  // 4. Deliver to each channel
  for (const link of channelLinks) {
    await deliverToChannel(em, link, outboundMessage, event)
  }
}

/**
 * Find all MessageChannelLinks for a given message ID
 */
async function findChannelLinksForMessage(
  em: EntityManager,
  messageId: string
): Promise<MessageChannelLink[]> {
  return em.find(MessageChannelLink, {
    messageId,
  })
}

/**
 * Deliver message to a specific channel
 *
 * @param em - EntityManager
 * @param link - MessageChannelLink
 * @param message - OutboundMessage
 * @param event - Original event
 */
async function deliverToChannel(
  em: EntityManager,
  link: MessageChannelLink,
  message: OutboundMessage,
  event: MessageSentEvent
): Promise<void> {
  const { providerKey, channelType, id: linkId } = link

  console.log(`[outbound-delivery] Delivering to channel ${channelType} (link: ${linkId})`)

  // 1. Get the adapter
  if (!providerKey) {
    console.error(`[outbound-delivery] No providerKey for link ${linkId}, skipping`)
    await updateDeliveryStatus(em, link, 'failed', 'No providerKey')
    return
  }

  const adapter = getAdapter(providerKey)
  if (!adapter) {
    console.error(`[outbound-delivery] No adapter found for provider: ${providerKey}`)
    await updateDeliveryStatus(em, link, 'failed', `Adapter not found: ${providerKey}`)
    return
  }

  // 2. Check if adapter supports convertOutbound (v2)
  if (!isChannelAdapterV2(adapter) || typeof adapter.convertOutbound !== 'function') {
    console.error(`[outbound-delivery] Adapter ${providerKey} does not support convertOutbound`)
    await updateDeliveryStatus(em, link, 'failed', 'Adapter does not support convertOutbound')
    return
  }

  // 3. Build channel ID from link (stored in channelPayload or derive from externalMessageId)
  const channelId = link.channelPayload?.channelId as string | undefined
    ?? link.externalMessageId // Fallback - this might not be correct, but adapter can handle

  if (!channelId) {
    console.error(`[outbound-delivery] No channelId for link ${linkId}`)
    await updateDeliveryStatus(em, link, 'failed', 'No channelId')
    return
  }

  // 4. Convert outbound message to channel-native format
  const convertInput: ConvertOutboundInput = {
    message,
    senderId: event.senderUserId,
    channelId,
    threadId: link.channelPayload?.threadId as string | undefined,
  }

  let nativeContent: unknown
  try {
    nativeContent = await adapter.convertOutbound(convertInput)
  } catch (error) {
    console.error(`[outbound-delivery] Failed to convert message:`, error)
    await updateDeliveryStatus(em, link, 'failed', `Conversion failed: ${error}`)
    return
  }

  // 5. Send message via adapter
  const sendResult = await sendWithRetry(
    adapter,
    nativeContent,
    channelId,
    link.channelPayload
  )

  // 6. Handle delivery result
  await handleDeliveryResult(em, link, sendResult)
}

/**
 * Send message with retry logic
 *
 * @param adapter - Channel adapter
 * @param nativeContent - Converted message content
 * @param channelId - Target channel ID
 * @param channelPayload - Additional payload from link
 * @returns SendMessageResult
 */
async function sendWithRetry(
  adapter: any,
  nativeContent: unknown,
  channelId: string,
  channelPayload: Record<string, unknown> | null
): Promise<SendMessageResult> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Build send input
      const sendInput = {
        content: nativeContent,
        channelId,
        metadata: {
          ...channelPayload,
          attempt,
        },
      }

      // Call adapter's sendMessage
      const result = await adapter.sendMessage(sendInput)
      console.log(`[outbound-delivery] Message sent successfully on attempt ${attempt + 1}`)
      return result
    } catch (error) {
      lastError = error as Error
      console.warn(`[outbound-delivery] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed:`, error)

      if (attempt < MAX_RETRIES) {
        // Exponential backoff
        const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, attempt)
        console.log(`[outbound-delivery] Retrying in ${backoffMs}ms...`)
        await sleep(backoffMs)
      }
    }
  }

  throw lastError ?? new Error('Unknown error during send')
}

/**
 * Handle delivery result - update delivery status
 */
async function handleDeliveryResult(
  em: EntityManager,
  link: MessageChannelLink,
  result: SendMessageResult
): Promise<void> {
  // Update the external message ID if provided
  if (result.messageId) {
    link.externalMessageId = result.messageId
  }

  // Update channel payload with result metadata
  link.channelPayload = {
    ...link.channelPayload,
    sentAt: result.timestamp?.toISOString(),
    metadata: result.metadata,
  }

  // Update delivery status
  await updateDeliveryStatus(em, link, 'sent')

  console.log(`[outbound-delivery] Successfully delivered to link ${link.id}, status: sent`)
}

/**
 * Update delivery status with error tracking
 */
async function updateDeliveryStatus(
  em: EntityManager,
  link: MessageChannelLink,
  status: 'pending' | 'sent' | 'delivered' | 'failed',
  error?: string
): Promise<void> {
  link.deliveryStatus = status
  link.updatedAt = new Date()

  if (error) {
    link.channelPayload = {
      ...link.channelPayload,
      lastError: error,
      lastErrorAt: new Date().toISOString(),
    }
  }

  await em.flush()
}

/**
 * Simple sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Subscriber Descriptor
// ============================================================================

export const outboundDeliverySubscriber: SubscriberDescriptor = {
  id: 'communication_channels:outbound-delivery',
  event: 'messages.message.sent',
  handler: onMessageSent,
}

// ============================================================================
// Metadata for module registration
// ============================================================================

export const metadata = {
  event: 'messages.message.sent' as const,
  id: 'communication_channels:outbound-delivery',
}

export default outboundDeliverySubscriber