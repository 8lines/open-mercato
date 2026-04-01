/**
 * ChannelAdapter v2 Contract
 * Based on SPEC-045d v2
 * Maintains backward compatibility with v1
 */

import type { ChannelCapabilities } from './capabilities.js'
import type {
  InboundMessage,
  NormalizedInboundMessage,
  OutboundMessage,
  ConvertOutboundInput,
  ChannelNativeContent,
  SendReactionInput,
  RemoveReactionInput,
  EditChannelMessageInput,
  DeleteChannelMessageInput,
  FetchHistoryInput,
  HistoryPage,
  ResolveContactInput,
  ContactHint,
  SendMessageResult,
  ChannelInfo,
  PresenceUpdate,
} from './types.js'

// ============================================================================
// V1 Base Types (for backward compatibility)
// ============================================================================

export interface MessageSendInput {
  channelId: string
  threadId?: string
  senderId: string
  content: string
  attachments?: Array<{
    type: string
    url?: string
    data?: string
    name: string
    mimeType: string
  }>
  metadata?: Record<string, unknown>
}

export interface MessageReceivePayload {
  id: string
  channelId: string
  threadId?: string
  senderId: string
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// ChannelAdapter V1 Interface (for reference)
// ============================================================================

/**
 * @deprecated Use ChannelAdapterV2 instead
 * Original v1 interface kept for reference
 */
export interface ChannelAdapterV1 {
  readonly providerKey: string
  readonly channelType: string

  sendMessage(input: MessageSendInput): Promise<{
    messageId: string
    channelId: string
    timestamp: Date
  }>

  processInbound(payload: MessageReceivePayload): Promise<void>

  verifyWebhook?(input: {
    headers: Record<string, string>
    body: string
  }): Promise<{
    eventType: string
    payload: MessageReceivePayload
  }>
}

// ============================================================================
// ChannelAdapter V2 Interface
// ============================================================================

export interface ChannelAdapterV2 {
  // Identity
  readonly providerKey: string
  readonly channelType: string

  // Capabilities (NEW in v2)
  readonly capabilities: ChannelCapabilities

  // V1 Methods (backward compatible)
  sendMessage(input: MessageSendInput): Promise<SendMessageResult>
  processInbound(payload: MessageReceivePayload): Promise<void>
  verifyWebhook?(input: {
    headers: Record<string, string>
    body: string
  }): Promise<{
    eventType: string
    payload: MessageReceivePayload
  }>

  // V2 Methods (optional - check capabilities before calling)

  /**
   * Normalize inbound message to unified format
   * Use when adapter receives message from channel and needs to convert to NormalizedInboundMessage
   */
  normalizeInbound?(raw: InboundMessage): Promise<NormalizedInboundMessage>

  /**
   * Convert outbound message to channel-native format
   */
  convertOutbound?(input: ConvertOutboundInput): Promise<ChannelNativeContent>

  /**
   * Send a reaction to a message
   */
  sendReaction?(input: SendReactionInput): Promise<void>

  /**
   * Remove a reaction from a message
   */
  removeReaction?(input: RemoveReactionInput): Promise<void>

  /**
   * Edit an existing message
   */
  editMessage?(input: EditChannelMessageInput): Promise<void>

  /**
   * Delete a message
   */
  deleteMessage?(input: DeleteChannelMessageInput): Promise<void>

  /**
   * Fetch conversation history
   */
  fetchHistory?(input: FetchHistoryInput): Promise<HistoryPage>

  /**
   * Resolve a contact identifier to contact info
   */
  resolveContact?(input: ResolveContactInput): Promise<ContactHint | null>

  /**
   * Get channel information
   */
  getChannelInfo?(input: { channelId: string }): Promise<ChannelInfo | null>

  /**
   * Update presence status
   */
  updatePresence?(input: PresenceUpdate): Promise<void>

  /**
   * Get current presence for users in a channel
   */
  getPresence?(input: {
    channelId: string
    userIds: string[]
  }): Promise<PresenceUpdate[]>

  /**
   * Subscribe to channel events (webhooks, webhooks, etc.)
   */
  subscribe?(input: {
    channelId: string
    webhookUrl: string
  }): Promise<{ subscriptionId: string }>

  /**
   * Unsubscribe from channel events
   */
  unsubscribe?(input: {
    channelId: string
    subscriptionId: string
  }): Promise<void>
}

// ============================================================================
// Type Guards
// ============================================================================

export function isChannelAdapterV2(adapter: unknown): adapter is ChannelAdapterV2 {
  if (!adapter || typeof adapter !== 'object') return false
  const obj = adapter as Record<string, unknown>
  return (
    typeof obj['providerKey'] === 'string' &&
    typeof obj['capabilities'] === 'object' &&
    obj['capabilities'] !== null
  )
}

export function supportsReactions(adapter: ChannelAdapterV2): boolean {
  return adapter.capabilities.reactions && typeof adapter.sendReaction === 'function'
}

export function supportsMessageEdit(adapter: ChannelAdapterV2): boolean {
  return adapter.capabilities.editMessage && typeof adapter.editMessage === 'function'
}

export function supportsMessageDelete(adapter: ChannelAdapterV2): boolean {
  return adapter.capabilities.deleteMessage && typeof adapter.deleteMessage === 'function'
}

export function supportsHistory(adapter: ChannelAdapterV2): boolean {
  return adapter.capabilities.conversationHistory && typeof adapter.fetchHistory === 'function'
}

export function supportsPresence(adapter: ChannelAdapterV2): boolean {
  return adapter.capabilities.presence && typeof adapter.updatePresence === 'function'
}

// ============================================================================
// Adapter Creation Helpers
// ============================================================================

/**
 * Create a v2 adapter with default capabilities
 * Useful for migrating v1 adapters to v2
 */
export function createAdapterWithCapabilities<T extends ChannelAdapterV2>(
  adapter: Omit<T, 'capabilities'> & Partial<Pick<T, 'capabilities'>>,
  capabilities: ChannelCapabilities
): T {
  return {
    ...adapter,
    capabilities,
  } as T
}
