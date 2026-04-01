import type { OpenApiRouteDoc } from '@open-mercato/shared/lib/openapi'
import { z } from 'zod'
import type { EntityManager } from '@mikro-orm/postgresql'
import { createRequestContainer } from '@open-mercato/shared/lib/di/container'
import { getAuthFromRequest } from '@open-mercato/shared/lib/auth/server'
import { resolveTranslations } from '@open-mercato/shared/lib/i18n/server'
import { resolveOrganizationScopeForRequest } from '@open-mercato/core/modules/directory/utils/organizationScope'
import { MessageReaction, MessageChannelLink } from '../../data/entities'
import { getAdapter } from '../../lib/registry'
import type { SendReactionInput, RemoveReactionInput } from '../../lib/types'
import type { ChannelAdapterV2 } from '../../lib/adapter'

function json(payload: unknown, init: ResponseInit = { status: 200 }): Response {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  })
}

type RequestScope = {
  em: EntityManager
  tenantId: string
  organizationId: string | null
  allowedOrganizationIds: string[] | null
}

async function resolveRequestScope(request: Request): Promise<RequestScope | Response> {
  const container = await createRequestContainer()
  const auth = await getAuthFromRequest(request)
  const { translate } = await resolveTranslations()

  if (!auth) {
    return json({ error: translate('api.errors.unauthorized', 'Unauthorized') }, { status: 401 })
  }

  const scope = await resolveOrganizationScopeForRequest({ container, auth, request })
  const tenantId = scope?.tenantId ?? auth.tenantId ?? null
  const organizationId = scope?.selectedId ?? auth.orgId ?? null
  const allowedOrganizationIds = Array.isArray(scope?.allowedIds) ? scope.allowedIds : null

  if (!tenantId) {
    return json({ error: translate('api.errors.tenantRequired', 'Tenant context required') }, { status: 400 })
  }

  return {
    em: container.resolve('em') as EntityManager,
    tenantId,
    organizationId,
    allowedOrganizationIds,
  }
}

function serializeReaction(reaction: MessageReaction) {
  return {
    id: reaction.id,
    emoji: reaction.emoji,
    userIdentifier: reaction.userIdentifier,
    userDisplayName: reaction.userDisplayName ?? null,
    userAvatarUrl: reaction.userAvatarUrl ?? null,
    channelType: reaction.channelType,
    providerKey: reaction.providerKey,
    timestamp: reaction.timestamp.toISOString(),
  }
}

// ============================================================================
// GET /channels/:channelId/messages/:messageId/reactions
// ============================================================================

export async function GET(request: Request, { channelId, messageId }: { channelId: string; messageId: string }) {
  const scope = await resolveRequestScope(request)
  if (scope instanceof Response) return scope

  const url = new URL(request.url)
  const emojiFilter = url.searchParams.get('emoji') || undefined

  // Find message channel links for this message
  const links = await scope.em.find(MessageChannelLink, {
    messageId,
    channelType: { $ne: null },
  })

  if (links.length === 0) {
    return json({ reactions: [] })
  }

  // Build query for reactions
  const reactionQuery: Record<string, unknown> = {
    messageChannelLinkId: { $in: links.map((l) => l.id) },
  }

  if (emojiFilter) {
    reactionQuery.emoji = emojiFilter
  }

  const reactions = await scope.em.find(MessageReaction, reactionQuery)

  return json({
    reactions: reactions.map(serializeReaction),
  })
}

// ============================================================================
// POST /channels/:channelId/messages/:messageId/reactions
// ============================================================================

const addReactionBodySchema = z.object({
  emoji: z.string().min(1).max(100),
  userIdentifier: z.string().min(1).max(200),
  userDisplayName: z.string().max(200).optional().nullable(),
  userAvatarUrl: z.string().url().max(500).optional().nullable(),
})

export async function POST(
  request: Request,
  { channelId, messageId }: { channelId: string; messageId: string },
) {
  const scope = await resolveRequestScope(request)
  if (scope instanceof Response) return scope

  // Parse and validate body
  const body = await request.json().catch(() => null)
  const parsed = addReactionBodySchema.safeParse(body)

  if (!parsed.success) {
    return json({ error: 'Invalid request body', details: parsed.error.flatten() }, { status: 400 })
  }

  const { emoji, userIdentifier, userDisplayName, userAvatarUrl } = parsed.data

  // Find message channel link
  const link = await scope.em.findOne(MessageChannelLink, { messageId })

  if (!link) {
    return json({ error: 'Message channel link not found' }, { status: 404 })
  }

  // Check if adapter supports reactions - use providerKey only
  const providerKey = link.providerKey || `${link.channelType}:default`
  const adapter = getAdapter(providerKey) as ChannelAdapterV2 | undefined
  const supportsReactions = adapter && typeof adapter.sendReaction === 'function'

  if (supportsReactions && adapter) {
    // Send to external platform via adapter
    const sendInput: SendReactionInput = {
      messageId: link.externalMessageId,
      channelId: channelId,
      emoji,
      userId: userIdentifier,
    }

    try {
      await adapter.sendReaction!(sendInput)
    } catch (err) {
      console.error('Failed to send reaction to adapter:', err)
      // Continue to save locally even if external fails
    }
  }

  // Create reaction record in database
  const reaction = scope.em.create(MessageReaction, {
    messageChannelLinkId: link.id,
    externalMessageId: link.externalMessageId,
    emoji,
    userIdentifier,
    userDisplayName,
    userAvatarUrl,
    channelType: link.channelType,
    providerKey: link.providerKey ?? '',
  } as any)

  await scope.em.persist(reaction)
  await scope.em.flush()

  return json(
    { reaction: serializeReaction(reaction) },
    { status: 201 },
  )
}

// ============================================================================
// DELETE /channels/:channelId/messages/:messageId/reactions/:reactionId
// ============================================================================

export async function DELETE(
  request: Request,
  { channelId, messageId, reactionId }: { channelId: string; messageId: string; reactionId: string },
) {
  const scope = await resolveRequestScope(request)
  if (scope instanceof Response) return scope

  // Find the reaction
  const reaction = await scope.em.findOne(MessageReaction, { id: reactionId })

  if (!reaction) {
    return json({ error: 'Reaction not found' }, { status: 404 })
  }

  // Find the associated channel link to get adapter info
  const link = await scope.em.findOne(MessageChannelLink, { id: reaction.messageChannelLinkId })

  if (link) {
    // Check if adapter supports reactions - use providerKey only
    const providerKey = link.providerKey || `${link.channelType}:default`
    const adapter = getAdapter(providerKey) as ChannelAdapterV2 | undefined
    const supportsRemoveReaction = adapter && typeof adapter.removeReaction === 'function'

    if (supportsRemoveReaction && adapter) {
      // Send to external platform via adapter
      const removeInput: RemoveReactionInput = {
        messageId: link.externalMessageId,
        channelId: channelId,
        emoji: reaction.emoji,
        userId: reaction.userIdentifier,
      }

      try {
        await adapter.removeReaction!(removeInput)
      } catch (err) {
        console.error('Failed to remove reaction from adapter:', err)
        // Continue to delete locally even if external fails
      }
    }
  }

  // Remove from database
  await scope.em.remove(reaction)
  await scope.em.flush()

  return json({ success: true })
}