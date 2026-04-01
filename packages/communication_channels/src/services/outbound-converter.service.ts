/**
 * Outbound Message Converter Service
 * Based on SPEC-045d v2
 * Converts unified messages to channel-native formats
 */

import { getAdapter } from '../lib/registry.js'
import type {
  OutboundMessage,
  ChannelNativeContent,
  ConvertOutboundInput,
} from '../lib/types.js'
import {
  isChannelAdapterV2,
  type ChannelAdapterV2,
} from '../lib/adapter.js'

// ============================================================================
// Service Interface
// ============================================================================

export interface OutboundConverterService {
  /**
   * Convert a message to channel-native format
   */
  convert(
    providerKey: string,
    message: OutboundMessage
  ): Promise<ChannelNativeContent>

  /**
   * Prepare metadata for outbound message
   */
  prepareMetadata(message: OutboundMessage): Record<string, unknown>
}

// ============================================================================
// Default Implementation
// ============================================================================

class DefaultOutboundConverterService implements OutboundConverterService {
  /**
   * Convert an outbound message using the appropriate adapter
   */
  async convert(
    providerKey: string,
    message: OutboundMessage
  ): Promise<ChannelNativeContent> {
    const adapter = getAdapter(providerKey)

    if (!adapter) {
      throw new Error(`Adapter not found for provider: ${providerKey}`)
    }

    // Check for v2 convertOutbound method
    if (isChannelAdapterV2(adapter) && typeof adapter.convertOutbound === 'function') {
      const convertInput: ConvertOutboundInput = {
        message,
        senderId: message.metadata?.senderId as string ?? 'system',
        channelId: message.metadata?.channelId as string ?? 'default',
        threadId: message.threadId,
      }

      return adapter.convertOutbound(convertInput)
    }

    // Fall back to v1 sendMessage format
    return this.fallbackToV1(providerKey, message, adapter)
  }

  /**
   * Prepare metadata for outbound message
   */
  prepareMetadata(message: OutboundMessage): Record<string, unknown> {
    const metadata: Record<string, unknown> = {
      bodyFormat: message.bodyFormat ?? 'text',
      hasAttachments: Boolean(message.attachments && message.attachments.length > 0),
      hasThread: Boolean(message.threadId),
      isReply: Boolean(message.replyToId),
      timestamp: new Date().toISOString(),
    }

    // Preserve original metadata
    if (message.metadata) {
      for (const [key, value] of Object.entries(message.metadata)) {
        if (key !== 'senderId' && key !== 'channelId') {
          metadata[key] = value
        }
      }
    }

    return metadata
  }

  /**
   * Fallback to v1 adapter behavior
   */
  private async fallbackToV1(
    providerKey: string,
    message: OutboundMessage,
    adapter: ChannelAdapterV2 | undefined
  ): Promise<ChannelNativeContent> {
    if (!adapter || typeof adapter.sendMessage !== 'function') {
      throw new Error(
        `Adapter ${providerKey} does not support sendMessage method`
      )
    }

    // v1 expects content as string
    // Convert attachments to v1 format if needed
    const v1Content = this.convertToV1Format(message)

    return {
      content: v1Content,
      metadata: this.prepareMetadata(message),
    }
  }

  /**
   * Convert message to v1 format (simple string content)
   */
  private convertToV1Format(message: OutboundMessage): string {
    let content = message.body

    // Handle attachments in v1 format (basic)
    if (message.attachments && message.attachments.length > 0) {
      const attachmentList = message.attachments
        .map((att) => att.name || att.type)
        .join(', ')

      if (content) {
        content += `\n\n[Attachments: ${attachmentList}]`
      } else {
        content = `[Attachments: ${attachmentList}]`
      }
    }

    return content || ''
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

export const outboundConverterService: OutboundConverterService =
  new DefaultOutboundConverterService()

// ============================================================================
// Export Factory (for custom implementations)
// ============================================================================

export function createOutboundConverterService(
  customService?: OutboundConverterService
): OutboundConverterService {
  return customService ?? new DefaultOutboundConverterService()
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Convert a message to channel-native format
 */
export async function convertOutboundMessage(
  providerKey: string,
  message: OutboundMessage
): Promise<ChannelNativeContent> {
  return outboundConverterService.convert(providerKey, message)
}

/**
 * Prepare metadata for outbound message
 */
export function prepareOutboundMetadata(message: OutboundMessage): Record<string, unknown> {
  return outboundConverterService.prepareMetadata(message)
}

/**
 * Convert multiple messages in batch
 */
export async function convertOutboundMessages(
  providerKey: string,
  messages: OutboundMessage[]
): Promise<ChannelNativeContent[]> {
  return Promise.all(
    messages.map((message) => outboundConverterService.convert(providerKey, message))
  )
}