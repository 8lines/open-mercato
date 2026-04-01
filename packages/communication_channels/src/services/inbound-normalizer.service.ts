/**
 * Inbound Message Normalizer Service
 * Based on SPEC-045d v2
 * Normalizes raw inbound messages from various channel adapters
 */

import { getAdapter } from '../lib/registry.js'
import type { InboundMessage, NormalizedInboundMessage } from '../lib/types.js'
import {
  MessageReceivePayload,
  isChannelAdapterV2,
  type ChannelAdapterV2,
} from '../lib/adapter.js'

// ============================================================================
// Service Interface
// ============================================================================

export interface InboundNormalizerService {
  /**
   * Normalize a raw inbound message to unified format
   */
  normalize(
    providerKey: string,
    raw: InboundMessage
  ): Promise<NormalizedInboundMessage>

  /**
   * Detect content type from raw message payload
   */
  detectContentType(raw: InboundMessage): string

  /**
   * Extract metadata from raw message
   */
  extractMetadata(raw: InboundMessage): Record<string, unknown>
}

// ============================================================================
// Default Implementation
// ============================================================================

class DefaultInboundNormalizerService implements InboundNormalizerService {
  /**
   * Normalize an inbound message using the appropriate adapter
   */
  async normalize(
    providerKey: string,
    raw: InboundMessage
  ): Promise<NormalizedInboundMessage> {
    const adapter = getAdapter(providerKey)

    if (!adapter) {
      throw new Error(`Adapter not found for provider: ${providerKey}`)
    }

    // Check for v2 normalizeInbound method
    if (isChannelAdapterV2(adapter) && typeof adapter.normalizeInbound === 'function') {
      return adapter.normalizeInbound(raw)
    }

    // Fall back to v1 processInbound method
    return this.fallbackToV1(providerKey, raw, adapter)
  }

  /**
   * Detect the content type from the raw payload
   * Returns format like 'slack/blocks', 'whatsapp/interactive', etc.
   */
  detectContentType(raw: InboundMessage): string {
    const metadata = raw.metadata ?? {}

    // Check for explicit content type in metadata
    if (metadata.channelContentType) {
      return metadata.channelContentType as string
    }

    // Infer from metadata
    if (metadata.slackBlocks) return 'slack/blocks'
    if (metadata.whatsappInteractive) return 'whatsapp/interactive'
    if (metadata.discordEmbeds) return 'discord/embeds'
    if (metadata.telegramPoll) return 'telegram/poll'

    // Default
    return 'text/plain'
  }

  /**
   * Extract metadata from the raw message
   */
  extractMetadata(raw: InboundMessage): Record<string, unknown> {
    return {
      ...raw.metadata,
      channelContentType: this.detectContentType(raw),
      originalTimestamp: raw.timestamp?.toISOString(),
      senderIdentifier: raw.sender,
      channelIdentifier: raw.channelId,
    }
  }

  /**
   * Fallback to v1 adapter behavior
   */
  private async fallbackToV1(
    providerKey: string,
    raw: InboundMessage,
    adapter: ChannelAdapterV2 | undefined
  ): Promise<NormalizedInboundMessage> {
    // Try v2 adapter's processInbound (if exists)
    if (adapter && typeof (adapter as ChannelAdapterV2).processInbound === 'function') {
      const v1Payload: MessageReceivePayload = {
        id: raw.raw && typeof raw.raw === 'object' && 'id' in raw.raw
          ? (raw.raw as Record<string, unknown>).id as string
          : `msg-${Date.now()}`,
        channelId: raw.channelId,
        threadId: raw.threadId,
        senderId: raw.sender,
        content: raw.content,
        timestamp: raw.timestamp,
        metadata: raw.metadata,
      }

      await (adapter as ChannelAdapterV2).processInbound(v1Payload)

      return this.convertV1PayloadToNormalized(providerKey, v1Payload)
    }

    // Final fallback - create normalized message directly
    return this.createBasicNormalizedMessage(providerKey, raw)
  }

  /**
   * Convert v1 payload to normalized format
   */
  private convertV1PayloadToNormalized(
    providerKey: string,
    payload: MessageReceivePayload
  ): NormalizedInboundMessage {
    return {
      id: payload.id,
      channelId: payload.channelId,
      threadId: payload.threadId,
      senderId: payload.senderId,
      senderType: this.detectSenderType(payload.senderId),
      body: payload.content,
      bodyFormat: 'text',
      timestamp: payload.timestamp,
      attachments: [],
      reactions: [],
      metadata: {
        ...payload.metadata,
        providerKey,
      },
    }
  }

  /**
   * Create a basic normalized message when no adapter method is available
   */
  private createBasicNormalizedMessage(
    providerKey: string,
    raw: InboundMessage
  ): NormalizedInboundMessage {
    const contentType = this.detectContentType(raw)

    return {
      id: raw.raw && typeof raw.raw === 'object' && 'id' in raw.raw
        ? (raw.raw as Record<string, unknown>).id as string
        : `msg-${Date.now()}`,
      channelId: raw.channelId,
      threadId: raw.threadId,
      senderId: raw.sender,
      senderType: this.detectSenderType(raw.sender),
      body: raw.content,
      bodyFormat: contentType === 'text/plain' ? 'text' : 'text',
      timestamp: raw.timestamp,
      editedAt: undefined,
      attachments: (raw.attachments ?? []).map((att) => ({
        id: att.id || `att-${Date.now()}`,
        type: att.type as 'image' | 'video' | 'audio' | 'file' | 'sticker',
        url: att.url || '',
        mimeType: att.mimeType,
        name: att.name,
        size: att.size,
        thumbnailUrl: att.url, // Use url as thumbnail for basic case
      })),
      reactions: [],
      metadata: this.extractMetadata(raw),
    }
  }

  /**
   * Detect sender type from sender identifier
   */
  private detectSenderType(senderId: string): 'user' | 'bot' | 'system' {
    if (senderId.startsWith('bot:') || senderId.startsWith('system:')) {
      return senderId.startsWith('bot:') ? 'bot' : 'system'
    }
    return 'user'
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const inboundNormalizerService: InboundNormalizerService =
  new DefaultInboundNormalizerService()

// ============================================================================
// Export Factory (for custom implementations)
// ============================================================================

export function createInboundNormalizerService(
  customService?: InboundNormalizerService
): InboundNormalizerService {
  return customService ?? new DefaultInboundNormalizerService()
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Normalize a raw message from a specific provider
 */
export async function normalizeInboundMessage(
  providerKey: string,
  raw: InboundMessage
): Promise<NormalizedInboundMessage> {
  return inboundNormalizerService.normalize(providerKey, raw)
}

/**
 * Detect content type without full normalization
 */
export function detectInboundContentType(raw: InboundMessage): string {
  return inboundNormalizerService.detectContentType(raw)
}

/**
 * Extract metadata from raw message
 */
export function extractInboundMetadata(raw: InboundMessage): Record<string, unknown> {
  return inboundNormalizerService.extractMetadata(raw)
}