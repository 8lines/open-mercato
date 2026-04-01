/**
 * Channel Badge Data Enricher
 * 
 * Enriches message list responses with channel information
 * for display in the ChannelBadgeWidget.
 */

import type { NormalizedInboundMessage } from '../../lib/types.js'

export interface ChannelInfo {
  type: string
  providerKey: string
  name?: string
}

export interface ChannelEnricherInput {
  messages: NormalizedInboundMessage[]
  tenantId: string
  organizationId: string
  channelLinks?: Array<{
    id: string
    channelId: string
    type: string
    providerKey: string
    name?: string
  }>
}

export interface ChannelEnricherOutput {
  messages: (NormalizedInboundMessage & { _channel: ChannelInfo | null })[]
}

/**
 * Enrich messages with channel information
 */
export function enrichMessagesWithChannel(input: ChannelEnricherInput): ChannelEnricherOutput {
  const { messages, channelLinks = [] } = input

  // Create a map for quick channel lookup
  const channelLinkMap = new Map<string, ChannelInfo>()
  for (const link of channelLinks) {
    channelLinkMap.set(link.channelId, {
      type: link.type,
      providerKey: link.providerKey,
      name: link.name,
    })
  }

  const enrichedMessages = messages.map((message) => {
    const channelInfo = channelLinkMap.get(message.channelId)

    return {
      ...message,
      _channel: channelInfo ?? null,
    }
  })

  return { messages: enrichedMessages }
}

/**
 * Get channel info from a message if available
 */
export function getChannelInfo(message: NormalizedInboundMessage): ChannelInfo | null {
  return (message as NormalizedInboundMessage & { _channel?: ChannelInfo | null })._channel ?? null
}

/**
 * Check if a message has channel info
 */
export function hasChannelInfo(message: NormalizedInboundMessage): boolean {
  const msg = message as NormalizedInboundMessage & { _channel?: ChannelInfo | null }
  return msg._channel !== undefined && msg._channel !== null
}