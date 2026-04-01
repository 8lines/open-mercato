/**
 * Slack channel capabilities
 * Based on SPEC-045d Phase 6
 */

import type { ChannelCapabilities } from '../communication_channels/lib/capabilities.js'

export const FULL_SLACK_CAPABILITIES: ChannelCapabilities = {
  threading: true,
  richText: true,
  fileSharing: true,
  maxFileSize: 10_000_000, // 10MB
  supportedMimeTypes: ['image/*', 'video/*', 'application/pdf'],
  readReceipts: false,
  deliveryReceipts: true,
  typingIndicators: true,
  reactions: true,
  multiReactionPerUser: true, // Slack allows multiple reactions per user
  editMessage: true,
  deleteMessage: true,
  presence: true,
  richBlocks: true,
  interactiveComponents: true,
  inlineImages: true,
  conversationHistory: true,
  contactCards: false,
  locationSharing: false,
  voiceNotes: false,
  stickers: true,
  supportedBodyFormats: ['text', 'markdown'],
  maxBodyLength: 30000,
}