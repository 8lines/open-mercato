/**
 * Reaction Bar Data Enricher
 * 
 * Enriches message list responses with grouped reactions data
 * for display in the ReactionBarWidget.
 */

import type { NormalizedInboundMessage } from '../../lib/types.js'

export interface GroupedReaction {
  emoji: string
  count: number
  users: string[]
  currentUserReacted: boolean
}

export interface ReactionEnricherInput {
  messages: NormalizedInboundMessage[]
  tenantId: string
  organizationId: string
  currentUserId?: string
}

export interface ReactionEnricherOutput {
  messages: (NormalizedInboundMessage & { _reactions: GroupedReaction[] })[]
}

/**
 * Group raw reactions by emoji
 */
export function enrichMessagesWithReactions(input: ReactionEnricherInput): ReactionEnricherOutput {
  const { messages, currentUserId } = input

  const enrichedMessages = messages.map((message) => {
    const rawReactions = message.reactions ?? []
    const groupedReactions = groupReactionsByEmoji(rawReactions, currentUserId)

    return {
      ...message,
      _reactions: groupedReactions,
    }
  })

  return { messages: enrichedMessages }
}

/**
 * Group reactions by emoji and include user info
 */
function groupReactionsByEmoji(
  reactions: Array<{ emoji: string; userIds: string[] }>,
  currentUserId?: string
): GroupedReaction[] {
  const grouped = new Map<string, GroupedReaction>()

  for (const reaction of reactions) {
    const existing = grouped.get(reaction.emoji)
    if (existing) {
      existing.count += reaction.userIds.length
      // Add new users, avoiding duplicates
      for (const userId of reaction.userIds) {
        if (!existing.users.includes(userId)) {
          existing.users.push(userId)
        }
      }
    } else {
      grouped.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: reaction.userIds.length,
        users: [...reaction.userIds],
        currentUserReacted: currentUserId ? reaction.userIds.includes(currentUserId) : false,
      })
    }
  }

  // Sort by count descending
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
}

/**
 * Check if a message has any reactions
 */
export function hasReactions(message: NormalizedInboundMessage): boolean {
  return (message.reactions?.length ?? 0) > 0
}

/**
 * Get all unique user IDs from reactions on a message
 */
export function getReactionUserIds(message: NormalizedInboundMessage): string[] {
  const userIds = new Set<string>()
  for (const reaction of message.reactions ?? []) {
    for (const userId of reaction.userIds) {
      userIds.add(userId)
    }
  }
  return Array.from(userIds)
}