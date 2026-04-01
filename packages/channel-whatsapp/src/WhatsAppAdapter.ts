/**
 * WhatsApp v2 Adapter
 * Implements ChannelAdapterV2 based on SPEC-045d Phase 7
 */

import type {
  ChannelAdapterV2,
  ChannelCapabilities,
  SendMessageResult,
} from '@open-mercato/communication_channels'

import type {
  WhatsAppAdapterConfig,
  WhatsAppInboundMessage,
  WhatsAppOutboundMessage,
} from './types.js'

import { WHATSAPP_V2_CAPABILITIES } from './capabilities.js'
import { WhatsAppClient } from './WhatsAppClient.js'

export class WhatsAppAdapter implements ChannelAdapterV2 {
  readonly providerKey = 'whatsapp'
  readonly channelType = 'whatsapp'
  readonly capabilities: ChannelCapabilities = WHATSAPP_V2_CAPABILITIES

  private client: WhatsAppClient

  constructor(config: WhatsAppAdapterConfig) {
    this.client = new WhatsAppClient({
      phoneNumberId: config.phoneNumberId,
      accessToken: config.accessToken,
      businessAccountId: config.businessAccountId,
      apiVersion: config.apiVersion ?? 'v21.0',
    })
  }

  async sendMessage(input: {
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
  }): Promise<SendMessageResult> {
    const { recipient, message } = this.buildOutboundMessage(input)

    const result = await this.client.sendMessage(recipient, message)

    return {
      messageId: result.messages[0].id,
      channelId: input.channelId,
      timestamp: new Date(),
      metadata: {
        messagingProduct: result.messages[0].messaging_product,
      },
    }
  }

  async processInbound(payload: {
    id: string
    channelId: string
    threadId?: string
    senderId: string
    content: string
    timestamp: Date
    metadata?: Record<string, unknown>
  }): Promise<void> {
    // Process inbound message - handled by webhook subscriber
    // This is for backward compatibility with v1
  }

  verifyWebhook?(input: {
    headers: Record<string, string>
    body: string
  }): Promise<{
    eventType: string
    payload: {
      id: string
      channelId: string
      threadId?: string
      senderId: string
      content: string
      timestamp: Date
      metadata?: Record<string, unknown>
    }
  }> {
    // Webhook verification handled by subscriber
    throw new Error('verifyWebhook not implemented - use webhook subscriber')
  }

  async convertOutbound(input: {
    message: {
      body: string
      bodyFormat?: 'text' | 'markdown' | 'html'
      threadId?: string
      replyToId?: string
      attachments?: Array<{
        type: 'image' | 'video' | 'audio' | 'file'
        url?: string
        data?: string
        name: string
        mimeType: string
      }>
      metadata?: Record<string, unknown>
    }
    senderId: string
    channelId: string
    threadId?: string
  }): Promise<{
    content: unknown
    metadata?: Record<string, unknown>
  }> {
    // Convert platform message to WhatsApp native format
    const interactive = input.message.metadata?.interactive as
      | { type: 'button' | 'list'; buttons?: Array<{ id: string; title: string }>; sections?: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }> }
      | undefined

    if (interactive) {
      return {
        content: {
          type: 'interactive',
          interactive,
        },
        metadata: {},
      }
    }

    // Handle attachments
    if (input.message.attachments && input.message.attachments.length > 0) {
      const attachment = input.message.attachments[0]
      const typeMap: Record<string, string> = {
        image: 'image',
        video: 'video',
        audio: 'audio',
        file: 'document',
      }

      return {
        content: {
          type: typeMap[attachment.type] || 'document',
          [typeMap[attachment.type] || 'document']: {
            link: attachment.url,
            caption: input.message.body,
          },
        },
        metadata: {},
      }
    }

    // Default to text
    return {
      content: {
        type: 'text',
        text: {
          body: input.message.body,
        },
      },
      metadata: {},
    }
  }

  async normalizeInbound(raw: {
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
  }): Promise<{
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
  }> {
    const waMessage = raw.raw as WhatsAppInboundMessage
    const entry = waMessage.entry?.[0]
    const change = entry?.changes?.[0]
    const value = change?.value
    const msg = value?.messages?.[0]

    return {
      id: msg?.id || raw.raw && typeof raw.raw === 'object' ? (raw.raw as any).entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.id : 'unknown',
      channelId: raw.channelId,
      threadId: raw.threadId || msg?.from,
      senderId: msg?.from || raw.sender,
      senderType: 'user',
      body: raw.content,
      bodyFormat: 'text',
      timestamp: raw.timestamp,
      attachments: (raw.attachments || []).map((a) => ({
        id: a.id,
        type: a.type as 'image' | 'video' | 'audio' | 'file' | 'sticker',
        url: a.url || '',
        mimeType: a.mimeType,
        name: a.name,
        size: a.size,
      })),
      reactions: [],
      metadata: raw.metadata || {},
    }
  }

  async sendReaction?(input: {
    messageId: string
    channelId: string
    threadId?: string
    emoji: string
    userId: string
  }): Promise<void> {
    // WhatsApp reactions
    await this.client.sendReaction(input.threadId || input.channelId, input.messageId, input.emoji)
  }

  async removeReaction?(input: {
    messageId: string
    channelId: string
    threadId?: string
    emoji: string
    userId: string
  }): Promise<void> {
    // WhatsApp removes reaction by sending empty emoji
    await this.client.sendReaction(input.threadId || input.channelId, input.messageId, '')
  }

  async resolveContact?(input: {
    identifier: string
    channelId: string
  }): Promise<{
    contactId?: string
    displayName?: string
    avatarUrl?: string
    metadata?: Record<string, unknown>
  } | null> {
    // WhatsApp contact resolution via phone number
    // Return null if not found - let CRM handle lookup
    return null
  }

  private buildOutboundMessage(input: {
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
  }): { recipient: string; message: WhatsAppOutboundMessage } {
    const recipient = input.threadId || input.senderId
    const attachments = input.attachments

    let message: WhatsAppOutboundMessage

    if (attachments && attachments.length > 0) {
      const attachment = attachments[0]
      const type = attachment.type.toLowerCase()

      if (type === 'image') {
        message = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'image',
          image: {
            link: attachment.url,
          },
        }
      } else if (type === 'video') {
        message = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'video',
          video: {
            link: attachment.url,
          },
        }
      } else if (type === 'audio') {
        message = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'audio',
          audio: {
            link: attachment.url,
          },
        }
      } else {
        message = {
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'document',
          document: {
            link: attachment.url,
            filename: attachment.name,
          },
        }
      }
    } else {
      message = {
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: {
          body: input.content,
        },
      }
    }

    return { recipient, message }
  }
}
