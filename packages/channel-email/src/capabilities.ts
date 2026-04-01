/**
 * Email v2 Capabilities
 * Based on SPEC-045d Phase 7
 */

import type { ChannelCapabilities } from '@open-mercato/communication_channels'

export const EMAIL_V2_CAPABILITIES: ChannelCapabilities = {
  // Core capabilities
  threading: true,
  richText: true,
  fileSharing: true,
  maxFileSize: 25_000_000, // 25MB (standard email limit)
  supportedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  readReceipts: true,
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
  contactCards: true, // vCard
  locationSharing: false,
  voiceNotes: false,
  stickers: false,

  // Content format
  supportedBodyFormats: ['text', 'html'],
  maxBodyLength: null, // No practical limit
}
