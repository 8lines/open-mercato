/**
 * Email v2 Adapter
 * Implements ChannelAdapterV2 based on SPEC-045d Phase 7
 */

import type {
  ChannelAdapterV2,
  ChannelCapabilities,
  SendMessageResult,
} from '@open-mercato/communication_channels'

import type {
  EmailAdapterConfig,
  EmailInboundMessage,
  EmailOutboundMessage,
} from './types.js'

import { EMAIL_V2_CAPABILITIES } from './capabilities.js'
import { parseEmail, stripSubjectPrefixes, generateMessageId, generateReferences } from './EmailParser.js'

export class EmailAdapter implements ChannelAdapterV2 {
  readonly providerKey = 'email'
  readonly channelType = 'email'
  readonly capabilities: ChannelCapabilities = EMAIL_V2_CAPABILITIES

  private config: EmailAdapterConfig
  private defaultFrom: string

  constructor(config: EmailAdapterConfig) {
    this.config = config
    this.defaultFrom = config.defaultFrom || 'noreply@localhost'
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
    const subject = (input.metadata?.subject as string) || 'No Subject'
    const inReplyTo = input.metadata?.inReplyTo as string | undefined
    const references = input.metadata?.references as string | undefined
    
    // Build email
    const email: EmailOutboundMessage = {
      from: input.senderId || this.defaultFrom,
      to: input.threadId || input.senderId,
      subject,
      text: input.content,
    }

    // Handle threading
    if (inReplyTo) {
      email.headers = {
        'In-Reply-To': inReplyTo,
        'References': generateReferences(inReplyTo, references),
      }
    }

    // Add attachments
    if (input.attachments && input.attachments.length > 0) {
      email.attachments = input.attachments.map(att => ({
        filename: att.name,
        content: att.data || att.url || '',
        contentType: att.mimeType,
      }))
    }

    // Send via SMTP
    if (this.config.smtp) {
      await this.sendViaSMTP(email)
    }

    return {
      messageId: generateMessageId('open-mercato.local'),
      channelId: input.channelId,
      timestamp: new Date(),
      metadata: {
        subject,
        inReplyTo,
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
    // Process inbound - handled by webhook subscriber
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
    // Webhook verification
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
    const { body, bodyFormat } = input.message

    // Convert to email format
    if (bodyFormat === 'html') {
      return {
        content: {
          html: body,
          text: stripHtml(body),
        },
        metadata: {
          subject: input.message.metadata?.subject || 'No Subject',
        },
      }
    }

    return {
      content: {
        text: body,
      },
      metadata: {
        subject: input.message.metadata?.subject || 'No Subject',
      },
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
    // Parse raw email if string
    let parsed: EmailInboundMessage | null = null
    let subject = ''
    let inReplyTo: string | undefined
    let references: string | undefined
    let messageId = ''

    if (typeof raw.raw === 'string') {
      try {
        parsed = parseEmail(raw.raw)
        subject = parsed.subject
        messageId = parsed.headers.messageId || ''
        inReplyTo = parsed.headers.inReplyTo
        references = parsed.headers.references
      } catch {
        // Fall back to raw content
      }
    }

    // Determine body format
    const bodyFormat: 'text' | 'html' = parsed?.html ? 'html' : 'text'

    return {
      id: messageId || raw.raw && typeof raw.raw === 'object' ? (raw.raw as any).messageId : 'unknown',
      channelId: raw.channelId,
      threadId: raw.threadId,
      senderId: parsed?.from.address || raw.sender,
      senderType: 'user',
      body: parsed?.text || parsed?.html || raw.content,
      bodyFormat,
      timestamp: raw.timestamp,
      attachments: (raw.attachments || []).map((a) => ({
        id: a.id,
        type: (a.type === 'image' || a.type === 'video' || a.type === 'audio' || a.type === 'file') 
          ? a.type 
          : 'file',
        url: a.url || '',
        mimeType: a.mimeType,
        name: a.name,
        size: a.size,
      })),
      reactions: [],
      replyToId: inReplyTo,
      metadata: {
        ...raw.metadata,
        subject,
        inReplyTo,
        references,
        cc: parsed?.cc,
      },
    }
  }

  async fetchHistory?(input: {
    channelId: string
    threadId?: string
    limit?: number
    before?: string
    after?: string
  }): Promise<{
    messages: Array<{
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
    }>
    nextCursor?: string
    previousCursor?: string
    hasMore: boolean
  }> {
    // Email history from IMAP
    if (!this.config.imap) {
      return { messages: [], hasMore: false }
    }

    // Simplified - actual implementation would use IMAP
    return { messages: [], hasMore: false }
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
    // Email contact resolution
    // Would integrate with CRM
    return null
  }

  private async sendViaSMTP(email: EmailOutboundMessage): Promise<void> {
    // SMTP implementation placeholder
    // In production, use nodemailer or similar
    console.log('[EmailAdapter] Sending email:', email)
  }
}

/**
 * Strip HTML tags for plain text fallback
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}
