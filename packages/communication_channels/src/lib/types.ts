/**
 * Helper types for ChannelAdapter v2
 * Based on SPEC-045d v2
 */

import type { ChannelCapabilities } from './capabilities.js'

// ============================================================================
// Message Types
// ============================================================================

export interface InboundMessage {
  raw: unknown
  sender: string
  channelId: string
  threadId?: string
  content: string
  timestamp: Date
  attachments?: Array<{
    id: string
    type: string
    url?: string
    mimeType?: string
    name?: string
    size?: number
  }>
  metadata?: Record<string, unknown>
}

export interface NormalizedInboundMessage {
  id: string
  channelId: string
  threadId?: string
  senderId: string
  senderType: 'user' | 'bot' | 'system'
  body: string
  bodyFormat: 'text' | 'markdown' | 'html'
  timestamp: Date
  editedAt?: Date
  attachments: Array<{
    id: string
    type: 'image' | 'video' | 'audio' | 'file' | 'sticker'
    url: string
    mimeType?: string
    name?: string
    size?: number
    thumbnailUrl?: string
  }>
  reactions: Array<{
    emoji: string
    userIds: string[]
  }>
  replyToId?: string
  metadata: Record<string, unknown>
}

export interface OutboundMessage {
  body: string
  bodyFormat?: 'text' | 'markdown' | 'html'
  threadId?: string
  replyToId?: string
  attachments?: Array<{
    type: 'image' | 'video' | 'audio' | 'file'
    url?: string
    data?: string // base64
    name: string
    mimeType: string
  }>
  metadata?: Record<string, unknown>
}

export interface ConvertOutboundInput {
  message: OutboundMessage
  senderId: string
  channelId: string
  threadId?: string
}

export interface ChannelNativeContent {
  content: unknown // Channel-specific native format
  metadata?: Record<string, unknown>
}

// ============================================================================
// Reaction Types
// ============================================================================

export interface SendReactionInput {
  messageId: string
  channelId: string
  threadId?: string
  emoji: string
  userId: string
}

export interface RemoveReactionInput {
  messageId: string
  channelId: string
  threadId?: string
  emoji: string
  userId: string
}

// ============================================================================
// Message Edit/Delete Types
// ============================================================================

export interface EditChannelMessageInput {
  messageId: string
  channelId: string
  threadId?: string
  newBody: string
  newBodyFormat?: 'text' | 'markdown' | 'html'
}

export interface DeleteChannelMessageInput {
  messageId: string
  channelId: string
  threadId?: string
  reason?: string
}

// ============================================================================
// History Types
// ============================================================================

export interface FetchHistoryInput {
  channelId: string
  threadId?: string
  limit?: number
  before?: string // cursor/timestamp
  after?: string // cursor/timestamp
}

export interface HistoryPage {
  messages: NormalizedInboundMessage[]
  nextCursor?: string
  previousCursor?: string
  hasMore: boolean
}

// ============================================================================
// Contact Types
// ============================================================================

export interface ResolveContactInput {
  identifier: string // email, phone, user ID, etc.
  channelId: string
}

export interface ContactHint {
  id: string
  name?: string
  avatarUrl?: string
  email?: string
  phone?: string
  channelSpecificId: string
}

// ============================================================================
// Presence Types
// ============================================================================

export type PresenceStatus = 'online' | 'away' | 'offline' | 'busy' | 'dnd'

export interface PresenceUpdate {
  userId: string
  channelId: string
  status: PresenceStatus
  lastSeen?: Date
}

// ============================================================================
// Channel Types
// ============================================================================

export interface ChannelInfo {
  id: string
  name?: string
  type: string // 'direct', 'group', 'channel', 'email', etc.
  isArchived: boolean
  memberCount?: number
  metadata?: Record<string, unknown>
}

export interface SendMessageResult {
  messageId: string
  channelId: string
  timestamp: Date
  metadata?: Record<string, unknown>
}
