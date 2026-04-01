/**
 * Reaction Worker
 *
 * Processes incoming and outgoing message reactions from external channels.
 * - Inbound: receives reactions from providers (Telegram, Slack, etc.)
 * - Outbound: sends reactions to external channels
 *
 * Queue: reactions
 */

import { EntityManager, MikroORM } from '@mikro-orm/core'
import type { JobContext, QueuedJob, WorkerMeta } from '@open-mercato/queue'
import { getAdapter, isChannelAdapterV2, supportsReactions } from '../lib/registry.js'

/**
 * Tenant scope interface (duplicated to avoid circular deps)
 */
interface TenantScope {
  tenantId: string
  organizationId?: string | null
}
import { MessageChannelLink, MessageReaction } from '../data/entities.js'

// ============================================================================
// Job Types
// ============================================================================

/**
 * Inbound reaction job payload
 */
export interface InboundReactionJob {
  /** Job type */
  type: 'inbound'
  /** Provider key (e.g., 'telegram-bot-001') */
  providerKey: string
  /** Channel type (e.g., 'telegram', 'slack', 'discord') */
  channelType: string
  /** External message ID this reaction is on */
  externalMessageId: string
  /** The emoji/reaction */
  emoji: string
  /** Platform user ID */
  userIdentifier: string
  /** Optional user display name */
  userDisplayName?: string
  /** Optional user avatar URL */
  userAvatarUrl?: string
  /** When the reaction occurred */
  timestamp: Date
}

/**
 * Outbound reaction job payload
 */
export interface OutboundReactionJob {
  /** Job type */
  type: 'outbound'
  /** Provider key (e.g., 'telegram-bot-001') */
  providerKey: string
  /** Channel type (e.g., 'telegram', 'slack', 'discord') */
  channelType: string
  /** External message ID to react to */
  externalMessageId: string
  /** The emoji/reaction */
  emoji: string
  /** Action: add or remove */
  action: 'add' | 'remove'
  /** Credentials for the provider */
  credentials: Record<string, unknown>
  /** Tenant scope */
  scope: TenantScope
}

/** Union type for all reaction jobs */
export type ReactionJob = InboundReactionJob | OutboundReactionJob

// ============================================================================
// Worker Metadata
// ============================================================================

export const metadata: WorkerMeta = {
  queue: 'reactions',
  id: 'communication_channels:reaction',
  concurrency: 10,
}

// ============================================================================
// Main Processing Functions
// ============================================================================

/**
 * Process an inbound reaction from an external channel
 *
 * @param em - MikroORM EntityManager
 * @param job - The queued job
 * @param _ctx - Job context
 */
export async function processInboundReaction(
  em: EntityManager,
  job: QueuedJob<InboundReactionJob>,
  _ctx: JobContext
): Promise<void> {
  const {
    providerKey,
    channelType,
    externalMessageId,
    emoji,
    userIdentifier,
    userDisplayName,
    userAvatarUrl,
    timestamp,
  } = job.payload

  console.log(`[reaction] Processing inbound reaction ${emoji} from ${userIdentifier} on message ${externalMessageId}`)

  // 1. Find the MessageChannelLink by externalMessageId + providerKey
  const link = await em.findOne(MessageChannelLink, {
    externalMessageId,
    providerKey,
  })

  if (!link) {
    console.warn(`[reaction] No message link found for externalMessageId: ${externalMessageId}, providerKey: ${providerKey}`)
    // Still create reaction entry for traceability even without link
  }

  // 2. Handle channel-specific behavior
  // WhatsApp: single reaction per user (replace old)
  // Slack: multiple reactions per user allowed
  // Telegram: single reaction per user (replace old)

  const existingReaction = await em.findOne(MessageReaction, {
    externalMessageId,
    userIdentifier,
    emoji,
  })

  if (existingReaction) {
    console.log(`[reaction] Reaction already exists, skipping`)
    return
  }

  // For platforms that only allow one reaction per user, remove old ones
  if (channelType === 'whatsapp' || channelType === 'telegram') {
    const oldReactions = await em.find(MessageReaction, {
      externalMessageId,
      userIdentifier,
    })

    for (const old of oldReactions) {
      em.remove(old)
    }
    await em.flush()
  }

  // 3. Create or update MessageReaction entity
  const reaction = new MessageReaction()
  reaction.messageChannelLinkId = link?.id ?? ''
  reaction.externalMessageId = externalMessageId
  reaction.emoji = emoji
  reaction.userIdentifier = userIdentifier
  reaction.userDisplayName = userDisplayName ?? null
  reaction.userAvatarUrl = userAvatarUrl ?? null
  reaction.channelType = channelType
  reaction.providerKey = providerKey
  reaction.timestamp = timestamp
  reaction.createdAt = new Date()
  reaction.updatedAt = new Date()

  em.persist(reaction)
  await em.flush()

  // 4. Emit event for UI update (optional - could use event emitter)
  console.log(`[reaction] Created reaction ${reaction.id} for message ${externalMessageId}`)
}

/**
 * Process an outbound reaction to send to an external channel
 *
 * @param em - MikroORM EntityManager
 * @param job - The queued job
 * @param _ctx - Job context
 */
export async function processOutboundReaction(
  em: EntityManager,
  job: QueuedJob<OutboundReactionJob>,
  _ctx: JobContext
): Promise<void> {
  const {
    providerKey,
    channelType,
    externalMessageId,
    emoji,
    action,
    credentials,
    scope,
  } = job.payload

  console.log(`[reaction] Processing outbound reaction: ${action} ${emoji} on message ${externalMessageId}`)

  // 1. Get adapter for providerKey
  const adapter = getAdapter(providerKey)
  if (!adapter) {
    console.error(`[reaction] No adapter found for provider: ${providerKey}`)
    throw new Error(`Adapter not found: ${providerKey}`)
  }

  // 2. Check capabilities - reactions supported?
  if (!isChannelAdapterV2(adapter)) {
    console.error(`[reaction] Adapter ${providerKey} is not v2`)
    throw new Error(`Adapter ${providerKey} does not support v2`)
  }

  if (!supportsReactions(adapter)) {
    console.error(`[reaction] Adapter ${providerKey} does not support reactions`)
    throw new Error(`Adapter ${providerKey} does not support reactions`)
  }

  // 3. Build the message link key for lookup
  const link = await em.findOne(MessageChannelLink, {
    externalMessageId,
    providerKey,
  })

  if (!link) {
    console.warn(`[reaction] No message link found for outbound reaction`)
  }

  // 4. Execute the action
  if (action === 'add') {
    // Call adapter.sendReaction
    const sendReactionInput = {
      channelId: link?.channelPayload?.channelId as string | undefined,
      messageId: externalMessageId,
      emoji,
      credentials,
      metadata: {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
      },
    }

    if (typeof adapter.sendReaction === 'function') {
      await adapter.sendReaction(sendReactionInput)
      console.log(`[reaction] Added reaction ${emoji} to message ${externalMessageId}`)
    } else {
      console.error(`[reaction] Adapter ${providerKey} does not implement sendReaction`)
      throw new Error(`Adapter ${providerKey} does not implement sendReaction`)
    }
  } else if (action === 'remove') {
    // Call adapter.removeReaction
    const removeReactionInput = {
      channelId: link?.channelPayload?.channelId as string | undefined,
      messageId: externalMessageId,
      emoji,
      credentials,
      metadata: {
        tenantId: scope.tenantId,
        organizationId: scope.organizationId,
      },
    }

    if (typeof adapter.removeReaction === 'function') {
      await adapter.removeReaction(removeReactionInput)
      console.log(`[reaction] Removed reaction ${emoji} from message ${externalMessageId}`)
    } else {
      console.error(`[reaction] Adapter ${providerKey} does not implement removeReaction`)
      throw new Error(`Adapter ${providerKey} does not implement removeReaction`)
    }
  }

  // 5. Update MessageReaction status if needed (for tracking outbound reactions)
  // This is optional - we could track which reactions we've sent
}

// ============================================================================
// Worker Handler (for queue runner)
// ============================================================================

/**
 * Main handler for the reaction queue worker
 *
 * @param job - The queued job
 * @param ctx - Job context
 */
export async function reactionHandler(
  job: QueuedJob<ReactionJob>,
  ctx: JobContext
): Promise<void> {
  // Get EntityManager from job metadata
  const em = job.metadata?.em as EntityManager | undefined

  if (!em) {
    console.error('[reaction] No EntityManager in job metadata')
    throw new Error('EntityManager not found in job metadata')
  }

  switch (job.payload.type) {
    case 'inbound':
      return processInboundReaction(em, job as QueuedJob<InboundReactionJob>, ctx)
    case 'outbound':
      return processOutboundReaction(em, job as QueuedJob<OutboundReactionJob>, ctx)
    default:
      throw new Error(`Unknown reaction job type: ${(job.payload as ReactionJob).type}`)
  }
}

// ============================================================================
// Queue Job Creators (for API routes)
// ============================================================================

/**
 * Create an inbound reaction job for the queue
 */
export function createInboundReactionJob(
  providerKey: string,
  channelType: string,
  externalMessageId: string,
  emoji: string,
  userIdentifier: string,
  options?: {
    userDisplayName?: string
    userAvatarUrl?: string
    timestamp?: Date
  }
): InboundReactionJob {
  return {
    type: 'inbound',
    providerKey,
    channelType,
    externalMessageId,
    emoji,
    userIdentifier,
    userDisplayName: options?.userDisplayName,
    userAvatarUrl: options?.userAvatarUrl,
    timestamp: options?.timestamp ?? new Date(),
  }
}

/**
 * Create an outbound reaction job for the queue
 */
export function createOutboundReactionJob(
  providerKey: string,
  channelType: string,
  externalMessageId: string,
  emoji: string,
  action: 'add' | 'remove',
  credentials: Record<string, unknown>,
  scope: TenantScope
): OutboundReactionJob {
  return {
    type: 'outbound',
    providerKey,
    channelType,
    externalMessageId,
    emoji,
    action,
    credentials,
    scope,
  }
}