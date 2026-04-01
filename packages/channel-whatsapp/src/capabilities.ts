/**
 * WhatsApp v2 Capabilities
 * Based on SPEC-045d Phase 7
 */

import type { ChannelCapabilities } from '@open-mercato/communication_channels'

export const WHATSAPP_V2_CAPABILITIES: ChannelCapabilities = {
  // Core capabilities
  threading: true,
  richText: true,
  fileSharing: true,
  maxFileSize: 16_000_000, // 16MB
  supportedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/ogg',
    'audio/mpeg',
    'audio/amr',
    'video/mp4',
    'video/3gpp',
    'application/pdf',
  ],
  readReceipts: true,
  deliveryReceipts: true,
  typingIndicators: true,

  // Extended capabilities
  reactions: true,
  multiReactionPerUser: false, // WhatsApp: one reaction per user per message
  editMessage: false,
  deleteMessage: false,
  presence: false,
  richBlocks: false,
  interactiveComponents: true, // Buttons, Lists, Reply buttons
  inlineImages: true,
  conversationHistory: false,
  contactCards: true, // vCard sharing
  locationSharing: true,
  voiceNotes: true,
  stickers: true,

  // Content format
  supportedBodyFormats: ['text', 'html'],
  maxBodyLength: 4096,
}
