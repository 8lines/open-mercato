/**
 * Inbound Message Worker
 *
 * Processes incoming messages from external channels (Telegram, Slack, Discord, etc.)
 * by normalizing them and creating internal Message records.
 *
 * Queue: inbound-messages
 */

import { EntityManager } from '@mikro-orm/core'
import type { JobContext, QueuedJob, WorkerMeta } from '@open-mercato/queue'
import { getAdapter, isChannelAdapterV2 } from '../lib/registry.js'
import type { InboundMessage, NormalizedInboundMessage } from '../lib/types.js'
import { MessageChannelLink, ChannelThreadMapping } from '../data/entities.js'
import { Message } from '@open-mercato/core/modules/messages/data/entities.js'

// ============================================================================
// Job Types
// ============================================================================

/**
 * Input job payload for inbound message processing
 */
export interface InboundMessageJob {
  /** Provider key (e.g., 'telegram-bot-001') */
  providerKey: string
  /** Channel type (e.g., 'telegram', 'slack', 'discord') */
  channelType: string
  /** Channel identifier (e.g., chat ID, workspace ID) */
  channelId: string
  /** External conversation/thread ID */
  externalConversationId: string
  /** External message ID for deduplication */
  externalMessageId: string
  /** Raw message payload from the provider */
  rawPayload: Record<string, unknown>
  /** Optional tenant scope */
  tenantId?: string
  /** Optional organization scope */
  organizationId?: string
}

// ============================================================================
// Worker Metadata
// ============================================================================

export const metadata: WorkerMeta = {
  queue: 'inbound-messages',
  id: 'communication_channels:inbound-message',
  concurrency: 5,
}

// ============================================================================
// Handler Context
// ============================================================================

type HandlerContext = {
  resolve: <T = unknown>(name: string) => T
}

// ============================================================================
// Main Processing Function
// ============================================================================

/**
 * Process an inbound message job from the queue
 *
 * @param em - MikroORM EntityManager
 * @param job - The queued job
 * @param ctx - Job context
 */
export async function processInboundMessageJob(
  em: EntityManager,
  job: QueuedJob<InboundMessageJob>,
  _ctx: JobContext
): Promise<void> {
  const {
    providerKey,
    channelType,
    channelId,
    externalConversationId,
    externalMessageId,
    rawPayload,
    tenantId,
    organizationId,
  } = job.payload

  console.log(`[inbound-message] Processing message ${externalMessageId} from ${providerKey}`)

  // 1. Validate and get the adapter
  const adapter = getAdapter(providerKey)
  if (!adapter) {
    console.error(`[inbound-message] No adapter found for provider: ${providerKey}`)
    throw new Error(`Adapter not found: ${providerKey}`)
  }

  // 2. Check if adapter supports normalizeInbound (v2)
  if (!isChannelAdapterV2(adapter) || typeof adapter.normalizeInbound !== 'function') {
    console.error(`[inbound-message] Adapter ${providerKey} does not support normalizeInbound`)
    throw new Error(`Adapter ${providerKey} does not support v2 normalizeInbound`)
  }

  // 3. Create raw InboundMessage from payload (adapter-specific)
  const inboundMessage = createInboundMessage(rawPayload, channelId)

  // 4. Normalize the message
  let normalized: NormalizedInboundMessage
  try {
    normalized = await adapter.normalizeInbound!(inboundMessage)
  } catch (error) {
    console.error(`[inbound-message] Failed to normalize message:`, error)
    throw error
  }

  // 5. Check for idempotency - message already exists?
  const existingLink = await em.findOne(MessageChannelLink, {
    externalMessageId,
    providerKey,
  })

  if (existingLink) {
    console.log(`[inbound-message] Message ${externalMessageId} already processed, skipping`)
    return
  }

  // 6. Find or create thread mapping
  const threadMapping = await findOrCreateThreadMapping(
    em,
    externalConversationId,
    channelId,
    normalized.threadId,
    tenantId,
    organizationId
  )

  // 7. Create Message in Messages module
  const message = await createMessageFromNormalized(
    em,
    normalized,
    threadMapping.messageThreadId,
    threadMapping.tenantId ?? undefined,
    threadMapping.organizationId ?? undefined
  )

  // 8. Create MessageChannelLink with full payload
  await linkMessageToChannel(
    em,
    message.id,
    externalMessageId,
    channelType,
    providerKey,
    {
      ...rawPayload,
      normalized: {
        id: normalized.id,
        threadId: normalized.threadId,
        senderId: normalized.senderId,
        senderType: normalized.senderType,
        timestamp: normalized.timestamp.toISOString(),
        editedAt: normalized.editedAt?.toISOString(),
      },
    }
  )

  // 9. Update thread mapping last activity
  threadMapping.lastActivityAt = new Date()
  await em.flush()

  console.log(`[inbound-message] Successfully processed message ${externalMessageId} -> message ${message.id}`)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create raw InboundMessage from provider payload
 */
function createInboundMessage(
  rawPayload: Record<string, unknown>,
  channelId: string
): InboundMessage {
  // Common field mappings across providers
  const sender = String(
    rawPayload.sender ??
    rawPayload.from ??
    rawPayload.user ??
    rawPayload.user_id ??
    rawPayload.from_id ??
    ''
  )

  const content = String(
    rawPayload.text ??
    rawPayload.content ??
    rawPayload.body ??
    rawPayload.message ??
    ''
  )

  // Parse timestamp (supports multiple formats)
  let timestamp: Date
  if (typeof rawPayload.timestamp === 'number') {
    timestamp = new Date(rawPayload.timestamp * 1000)
  } else if (typeof rawPayload.date === 'number') {
    timestamp = new Date(rawPayload.date * 1000)
  } else if (typeof rawPayload.timestamp === 'string') {
    timestamp = new Date(parseInt(rawPayload.timestamp, 10) * 1000)
  } else {
    timestamp = new Date()
  }

  const threadId = rawPayload.thread_ts as string | undefined
    ?? rawPayload.chat_thread_id as string | undefined
    ?? rawPayload.message_thread_id as string | undefined

  const attachments = rawPayload.attachments as InboundMessage['attachments']
  const metadata = rawPayload.metadata as Record<string, unknown>

  return {
    raw: rawPayload,
    sender,
    channelId,
    threadId,
    content,
    timestamp,
    attachments,
    metadata,
  }
}

/**
 * Find or create a ChannelThreadMapping
 */
async function findOrCreateThreadMapping(
  em: EntityManager,
  externalConversationId: string,
  channelId: string,
  internalThreadId?: string,
  tenantId?: string,
  organizationId?: string
): Promise<ChannelThreadMapping> {
  // Try to find existing mapping
  const existing = await em.findOne(ChannelThreadMapping, {
    externalConversationId,
    channelId,
  })

  if (existing) {
    return existing
  }

  // Create new mapping
  const messageThreadId = internalThreadId ?? crypto.randomUUID()
  const now = new Date()

  const mapping = new ChannelThreadMapping()
  mapping.externalConversationId = externalConversationId
  mapping.channelId = channelId
  mapping.messageThreadId = messageThreadId
  mapping.tenantId = tenantId ?? null
  mapping.organizationId = organizationId ?? null
  mapping.lastActivityAt = now
  mapping.createdAt = now
  mapping.updatedAt = now

  em.persist(mapping)
  await em.flush()

  console.log(`[inbound-message] Created new thread mapping: ${mapping.id} (thread: ${messageThreadId})`)

  return mapping
}

/**
 * Create Message entity from normalized message
 */
async function createMessageFromNormalized(
  em: EntityManager,
  normalized: NormalizedInboundMessage,
  threadId: string,
  tenantId?: string,
  organizationId?: string
): Promise<Message> {
  const now = new Date()

  const message = new Message()
  message.type = 'default'
  message.threadId = threadId
  message.parentMessageId = normalized.replyToId ?? null
  message.senderUserId = normalized.senderId
  message.subject = normalized.body.slice(0, 200).split('\n')[0] // First line as subject
  message.body = normalized.body
  message.bodyFormat = normalized.bodyFormat
  message.priority = 'normal'
  message.status = 'sent'
  message.isDraft = false
  message.sentAt = normalized.timestamp
  message.tenantId = tenantId ?? '00000000-0000-0000-0000-000000000000' // Default tenant
  message.organizationId = organizationId ?? null
  message.createdAt = now
  message.updatedAt = now

  em.persist(message)
  await em.flush()

  return message
}

/**
 * Link internal message to external channel
 */
async function linkMessageToChannel(
  em: EntityManager,
  messageId: string,
  externalMessageId: string,
  channelType: string,
  providerKey: string,
  channelPayload?: Record<string, unknown>
): Promise<MessageChannelLink> {
  const now = new Date()

  const link = new MessageChannelLink()
  link.messageId = messageId
  link.externalMessageId = externalMessageId
  link.channelType = channelType
  link.providerKey = providerKey
  link.channelPayload = channelPayload ?? null
  link.deliveryStatus = 'sent'
  link.createdAt = now
  link.updatedAt = now

  em.persist(link)
  await em.flush()

  return link
}

// ============================================================================
// Worker Handler (for queue runner)
// ============================================================================

/**
 * Main handler for the queue worker
 *
 * This function wraps processInboundMessageJob to work with the queue runner's context.
 * The EntityManager should be resolved from the handler context.
 *
 * @param job - The queued job
 * @param ctx - Job context
 */
export async function inboundMessageHandler(
  job: QueuedJob<InboundMessageJob>,
  ctx: JobContext
): Promise<void> {
  // Get EntityManager from job metadata (set by worker runner or queue configuration)
  const em = job.metadata?.em as EntityManager | undefined

  if (!em) {
    console.error('[inbound-message] No EntityManager in job metadata')
    throw new Error('EntityManager not found in job metadata')
  }

  await processInboundMessageJob(em, job, ctx)
}