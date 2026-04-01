/**
 * ChannelCapabilities - defines what features a channel adapter supports
 * Based on SPEC-045d v2
 */

export interface ChannelCapabilities {
  // Core messaging
  threading: boolean
  richText: boolean
  fileSharing: boolean
  maxFileSize?: number
  supportedMimeTypes?: string[]
  readReceipts: boolean
  deliveryReceipts: boolean
  typingIndicators: boolean

  // Extended messaging
  reactions: boolean
  multiReactionPerUser: boolean
  editMessage: boolean
  deleteMessage: boolean
  presence: boolean
  richBlocks: boolean
  interactiveComponents: boolean
  inlineImages: boolean
  conversationHistory: boolean
  contactCards: boolean
  locationSharing: boolean
  voiceNotes: boolean
  stickers: boolean

  // Content format
  supportedBodyFormats: Array<'text' | 'markdown' | 'html'>
  maxBodyLength?: number
}

/**
 * Default capabilities for v1 adapters (minimal feature set)
 */
export const DEFAULT_CAPABILITIES: ChannelCapabilities = {
  threading: false,
  richText: false,
  fileSharing: false,
  readReceipts: false,
  deliveryReceipts: false,
  typingIndicators: false,
  reactions: false,
  multiReactionPerUser: false,
  editMessage: false,
  deleteMessage: false,
  presence: false,
  richBlocks: false,
  interactiveComponents: false,
  inlineImages: false,
  conversationHistory: false,
  contactCards: false,
  locationSharing: false,
  voiceNotes: false,
  stickers: false,
  supportedBodyFormats: ['text'],
}

/**
 * Full capabilities for modern channels (Telegram, Slack, etc.)
 */
export const FULL_CAPABILITIES: ChannelCapabilities = {
  threading: true,
  richText: true,
  fileSharing: true,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  supportedMimeTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf', 'application/zip'],
  readReceipts: true,
  deliveryReceipts: true,
  typingIndicators: true,
  reactions: true,
  multiReactionPerUser: true,
  editMessage: true,
  deleteMessage: true,
  presence: false,
  richBlocks: false,
  interactiveComponents: true,
  inlineImages: true,
  conversationHistory: true,
  contactCards: false,
  locationSharing: true,
  voiceNotes: true,
  stickers: true,
  supportedBodyFormats: ['text', 'markdown'],
  maxBodyLength: 4096,
}

/**
 * Email capabilities (different from chat)
 */
export const EMAIL_CAPABILITIES: ChannelCapabilities = {
  threading: true,
  richText: true,
  fileSharing: true,
  maxFileSize: 25 * 1024 * 1024, // 25MB
  supportedMimeTypes: ['image/*', 'application/pdf', 'application/zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  readReceipts: false,
  deliveryReceipts: true,
  typingIndicators: false,
  reactions: false,
  multiReactionPerUser: false,
  editMessage: false,
  deleteMessage: false,
  presence: false,
  richBlocks: false,
  interactiveComponents: false,
  inlineImages: true,
  conversationHistory: true,
  contactCards: false,
  locationSharing: false,
  voiceNotes: false,
  stickers: false,
  supportedBodyFormats: ['text', 'html'],
  maxBodyLength: 102400, // 100KB
}
