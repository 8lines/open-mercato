/**
 * Channel Content Type Taxonomy
 * 
 * Format: {provider}/{type} - np. 'slack/blocks', 'whatsapp/interactive'
 * Identyfikatory formatów content przesyłane przez kanały.
 */

// ============================================================================
// Slack Types
// ============================================================================

export const SLACK_BLOCKS = 'slack/blocks'
export const SLACK_MESSAGE = 'slack/message'
export const SLACK_ATTACHMENTS = 'slack/attachments'

// ============================================================================
// WhatsApp Types
// ============================================================================

export const WHATSAPP_TEXT = 'whatsapp/text'
export const WHATSAPP_INTERACTIVE = 'whatsapp/interactive'
export const WHATSAPP_IMAGE = 'whatsapp/image'
export const WHATSAPP_VIDEO = 'whatsapp/video'
export const WHATSAPP_AUDIO = 'whatsapp/audio'
export const WHATSAPP_DOCUMENT = 'whatsapp/document'
export const WHATSAPP_CONTACT = 'whatsapp/contact'
export const WHATSAPP_LOCATION = 'whatsapp/location'
export const WHATSAPP_STICKER = 'whatsapp/sticker'

// ============================================================================
// Telegram Types
// ============================================================================

export const TELEGRAM_TEXT = 'telegram/text'
export const TELEGRAM_PHOTO = 'telegram/photo'
export const TELEGRAM_VIDEO = 'telegram/video'
export const TELEGRAM_AUDIO = 'telegram/audio'
export const TELEGRAM_VOICE = 'telegram/voice'
export const TELEGRAM_DOCUMENT = 'telegram/document'
export const TELEGRAM_STICKER = 'telegram/sticker'
export const TELEGRAM_LOCATION = 'telegram/location'
export const TELEGRAM_CONTACT = 'telegram/contact'

// ============================================================================
// Email Types
// ============================================================================

export const EMAIL_PLAIN = 'email/plain'
export const EMAIL_HTML = 'email/html'
export const EMAIL_MIME = 'email/mime'

// ============================================================================
// Generic Types
// ============================================================================

export const TEXT_PLAIN = 'text/plain'
export const TEXT_MARKDOWN = 'text/markdown'
export const APPLICATION_JSON = 'application/json'

// ============================================================================
// Type Arrays for convenience
// ============================================================================

export const SLACK_CONTENT_TYPES = [
  SLACK_BLOCKS,
  SLACK_MESSAGE,
  SLACK_ATTACHMENTS,
] as const

export const WHATSAPP_CONTENT_TYPES = [
  WHATSAPP_TEXT,
  WHATSAPP_INTERACTIVE,
  WHATSAPP_IMAGE,
  WHATSAPP_VIDEO,
  WHATSAPP_AUDIO,
  WHATSAPP_DOCUMENT,
  WHATSAPP_CONTACT,
  WHATSAPP_LOCATION,
  WHATSAPP_STICKER,
] as const

export const TELEGRAM_CONTENT_TYPES = [
  TELEGRAM_TEXT,
  TELEGRAM_PHOTO,
  TELEGRAM_VIDEO,
  TELEGRAM_AUDIO,
  TELEGRAM_VOICE,
  TELEGRAM_DOCUMENT,
  TELEGRAM_STICKER,
  TELEGRAM_LOCATION,
  TELEGRAM_CONTACT,
] as const

export const EMAIL_CONTENT_TYPES = [
  EMAIL_PLAIN,
  EMAIL_HTML,
  EMAIL_MIME,
] as const

// ============================================================================
// ContentTypeDetector Interface
// ============================================================================

import type { InboundMessage } from './types.js'

export interface ContentTypeDetector {
  /**
   * Detect content type from raw inbound message
   */
  detect(raw: InboundMessage): string
  
  /**
   * Check if a content type is supported by this detector
   */
  isSupported(type: string): boolean
  
  /**
   * Get the appropriate renderer for a content type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRenderer(type: string): MessageContentRenderer | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface MessageContentRenderer {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render(content: any): unknown
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if content type is Slack-related
 */
export function isSlackContent(type: string): boolean {
  return type.startsWith('slack/')
}

/**
 * Check if content type is WhatsApp-related
 */
export function isWhatsAppContent(type: string): boolean {
  return type.startsWith('whatsapp/')
}

/**
 * Check if content type is Telegram-related
 */
export function isTelegramContent(type: string): boolean {
  return type.startsWith('telegram/')
}

/**
 * Check if content type is Email-related
 */
export function isEmailContent(type: string): boolean {
  return type.startsWith('email/')
}

/**
 * Parse content type into provider and format
 */
export function parseContentType(type: string): { provider: string; format: string } | null {
  const parts = type.split('/')
  if (parts.length !== 2) {
    return null
  }
  return {
    provider: parts[0],
    format: parts[1],
  }
}

/**
 * Check if a content type has a registered renderer
 */
export function hasRenderer(type: string): boolean {
  return globalContentTypeRegistry.renderers.has(type)
}

/**
 * Get list of all supported content types
 */
export function getSupportedTypes(): string[] {
  return Array.from(globalContentTypeRegistry.renderers.keys())
}

// ============================================================================
// Content Type Registry
// ============================================================================

interface ContentTypeRegistry {
  detectors: Map<string, ContentTypeDetector>
  renderers: Map<string, MessageContentRenderer>
  defaultDetectors: Map<string, ContentTypeDetector>
}

const globalContentTypeRegistry: ContentTypeRegistry = {
  detectors: new Map(),
  renderers: new Map(),
  defaultDetectors: new Map(),
}

/**
 * Register a content type detector for a specific provider
 */
export function registerContentTypeDetector(
  providerKey: string,
  detector: ContentTypeDetector
): void {
  globalContentTypeRegistry.detectors.set(providerKey, detector)
}

/**
 * Get content type detector for a specific provider
 */
export function getContentTypeDetector(providerKey: string): ContentTypeDetector | null {
  return globalContentTypeRegistry.detectors.get(providerKey) ?? null
}

/**
 * Register a renderer for a content type
 */
export function registerContentTypeRenderer(
  type: string,
  renderer: MessageContentRenderer
): void {
  globalContentTypeRegistry.renderers.set(type, renderer)
}

/**
 * Get renderer for a specific content type
 */
export function getContentTypeRenderer(type: string): MessageContentRenderer | null {
  return globalContentTypeRegistry.renderers.get(type) ?? null
}

/**
 * Register a default detector for a provider (fallback)
 */
export function registerDefaultContentTypeDetector(
  providerKey: string,
  detector: ContentTypeDetector
): void {
  globalContentTypeRegistry.defaultDetectors.set(providerKey, detector)
}

/**
 * Get default detector for a provider (with fallback)
 */
export function getDefaultContentTypeDetector(providerKey: string): ContentTypeDetector | null {
  return globalContentTypeRegistry.defaultDetectors.get(providerKey) ?? null
}

/**
 * Clear all registered content type detectors and renderers
 */
export function clearContentTypeRegistry(): void {
  globalContentTypeRegistry.detectors.clear()
  globalContentTypeRegistry.renderers.clear()
  globalContentTypeRegistry.defaultDetectors.clear()
}

/**
 * List all registered provider keys
 */
export function listRegisteredProviders(): string[] {
  return Array.from(globalContentTypeRegistry.detectors.keys())
}