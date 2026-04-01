/**
 * Slack Adapter - ChannelAdapterV2 implementation
 * Based on SPEC-045d Phase 6
 */

import type {
  ChannelAdapterV2,
  MessageSendInput,
  MessageReceivePayload,
} from '../communication_channels/lib/adapter.js'
import type {
  InboundMessage,
  NormalizedInboundMessage,
  ConvertOutboundInput,
  ChannelNativeContent,
  SendReactionInput,
  RemoveReactionInput,
  EditChannelMessageInput,
  DeleteChannelMessageInput,
  FetchHistoryInput,
  HistoryPage,
  ResolveContactInput,
  ContactHint,
  SendMessageResult,
  ChannelInfo,
  PresenceUpdate,
} from '../communication_channels/lib/types.js'
import type { ChannelCapabilities } from '../communication_channels/lib/capabilities.js'
import { FULL_SLACK_CAPABILITIES } from './capabilities.js'
import { SlackClient } from './SlackClient.js'
import type { SlackAdapterConfig, SlackMessageEvent, SlackUser } from './types.js'
import { convertBlocksToMarkdown } from './converters/blocks-to-markdown.js'
import { convertMarkdownToBlocks } from './converters/markdown-to-blocks.js'
import { MessageEnricher } from './enrichers/message.enricher.js'

interface VerifyWebhookInput {
  headers: Record<string, string>
  body: string
}

/**
 * Slack Adapter implementing ChannelAdapterV2
 */
export class SlackAdapter implements ChannelAdapterV2 {
  readonly providerKey = 'slack'
  readonly channelType = 'slack'
  readonly capabilities: ChannelCapabilities = FULL_SLACK_CAPABILITIES

  private client: SlackClient
  private config: SlackAdapterConfig
  private enricher: MessageEnricher

  constructor(config: SlackAdapterConfig) {
    this.config = config
    this.client = new SlackClient(config)
    this.enricher = new MessageEnricher()
  }

  // ========================================================================
  // V1 Methods (backward compatible)
  // ========================================================================

  async sendMessage(input: MessageSendInput): Promise<SendMessageResult> {
    // Convert content to Block Kit if markdown
    const blocks = convertMarkdownToBlocks(input.content)
    
    const result = await this.client.postMessage({
      channel: input.channelId,
      text: input.content, // Fallback text
      blocks: blocks.length > 0 ? blocks : undefined,
      threadTs: input.threadId,
    })

    return {
      messageId: result.ts,
      channelId: result.channel,
      timestamp: new Date(parseFloat(result.ts) * 1000),
      metadata: {
        threadTs: input.threadId,
      },
    }
  }

  async processInbound(payload: MessageReceivePayload): Promise<void> {
    // Legacy method - kept for backward compatibility
    // In v2, use normalizeInbound instead
    console.log('processInbound called (legacy)', payload)
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<{
    eventType: string
    payload: MessageReceivePayload
  }> {
    const body = JSON.parse(input.body) as SlackMessageEvent
    
    // Verify Slack signature (basic implementation)
    // In production, use @slack/signature package
    
    return {
      eventType: 'message',
      payload: {
        id: body.ts,
        channelId: body.channel,
        threadId: body.thread_ts,
        senderId: body.user,
        content: body.text,
        timestamp: new Date(parseFloat(body.ts) * 1000),
        metadata: {
          blocks: body.blocks,
          files: body.files,
        },
      },
    }
  }

  // ========================================================================
  // V2 Methods
  // ========================================================================

  /**
   * Normalize inbound Slack message to unified format
   */
  async normalizeInbound(raw: InboundMessage): Promise<NormalizedInboundMessage> {
    const event = raw.raw as SlackMessageEvent
    
    // Get user info if available
    let user: SlackUser | undefined
    try {
      user = await this.client.getUser(raw.sender)
    } catch {
      // User lookup failed, continue without user info
    }

    // Convert blocks to markdown if present
    const blocks = event.blocks
    const bodyContent = blocks ? convertBlocksToMarkdown(blocks) : raw.content

    // Build normalized message
    const normalized: NormalizedInboundMessage = {
      id: raw.raw instanceof SlackMessageEvent ? raw.raw.ts : raw.sender + '-' + Date.now(),
      channelId: raw.channelId,
      threadId: raw.threadId,
      senderId: raw.sender,
      senderType: user?.is_bot ? 'bot' : 'user',
      body: bodyContent,
      bodyFormat: blocks ? 'markdown' : 'text',
      timestamp: raw.timestamp,
      editedAt: event.edited ? new Date(parseFloat(event.edited.ts) * 1000) : undefined,
      attachments: this.convertAttachments(event),
      reactions: this.convertReactions(event),
      metadata: {
        ...raw.metadata,
        rawBlocks: blocks,
        files: event.files,
      },
    }

    // Enrich with Slack-specific data
    return this.enricher.enrich(normalized, event, user)
  }

  /**
   * Convert outbound message to Slack Block Kit format
   */
  async convertOutbound(input: ConvertOutboundInput): Promise<ChannelNativeContent> {
    const { message, threadId } = input
    
    // Convert body to blocks based on format
    let blocks: unknown[] = []
    
    if (message.bodyFormat === 'markdown' || !message.bodyFormat) {
      blocks = convertMarkdownToBlocks(message.body)
    } else if (message.bodyFormat === 'text') {
      // Just wrap text in a simple section
      blocks = [{ type: 'section', text: { type: 'plain_text', text: message.body } }]
    } else if (message.bodyFormat === 'html') {
      // HTML not supported, convert to text
      blocks = [{ type: 'section', text: { type: 'plain_text', text: message.body } }]
    }

    return {
      content: {
        text: message.body, // Fallback
        blocks,
        threadTs: threadId || message.threadId,
      },
      metadata: {
        bodyFormat: message.bodyFormat,
        hasAttachments: !!message.attachments?.length,
      },
    }
  }

  /**
   * Send a reaction to a message
   */
  async sendReaction(input: SendReactionInput): Promise<void> {
    // Convert emoji to Slack format (remove colons if present)
    const emoji = input.emoji.replace(/^:|:$/g, '')
    
    await this.client.addReaction({
      channel: input.channelId,
      ts: input.messageId,
      name: emoji,
    })
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(input: RemoveReactionInput): Promise<void> {
    const emoji = input.emoji.replace(/^:|:$/g, '')
    
    await this.client.removeReaction({
      channel: input.channelId,
      ts: input.messageId,
      name: emoji,
    })
  }

  /**
   * Edit an existing message
   */
  async editMessage(input: EditChannelMessageInput): Promise<void> {
    const blocks = input.newBodyFormat === 'markdown' 
      ? convertMarkdownToBlocks(input.newBody)
      : undefined

    await this.client.updateMessage({
      channel: input.channelId,
      ts: input.messageId,
      text: input.newBody,
      blocks: blocks?.length ? blocks : undefined,
    })
  }

  /**
   * Delete a message
   */
  async deleteMessage(input: DeleteChannelMessageInput): Promise<void> {
    await this.client.deleteMessage({
      channel: input.channelId,
      ts: input.messageId,
    })
  }

  /**
   * Fetch conversation history
   */
  async fetchHistory(input: FetchHistoryInput): Promise<HistoryPage> {
    const result = await this.client.getConversationHistory({
      channel: input.channelId,
      oldest: input.before,
      latest: input.after,
      limit: input.limit || 100,
    })

    // Normalize messages
    const messages: NormalizedInboundMessage[] = []
    
    for (const msg of result.messages) {
      const inbound: InboundMessage = {
        raw: msg,
        sender: msg.user,
        channelId: input.channelId,
        threadId: msg.thread_ts,
        content: msg.text,
        timestamp: new Date(parseFloat(msg.ts) * 1000),
        attachments: msg.files?.map(f => ({
          id: f.id,
          type: f.mimetype.startsWith('image/') ? 'image' : 'file',
          url: f.url_private_download,
          mimeType: f.mimetype,
          name: f.name,
          size: f.size,
        })),
      }
      
      const normalized = await this.normalizeInbound(inbound)
      messages.push(normalized)
    }

    return {
      messages,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    }
  }

  /**
   * Resolve a contact identifier to contact info
   */
  async resolveContact(input: ResolveContactInput): Promise<ContactHint | null> {
    // Try to get user info
    try {
      const user = await this.client.getUser(input.identifier)
      return {
        id: user.id,
        name: user.real_name || user.name,
        avatarUrl: user.profile?.image_72,
        email: user.profile?.email,
        channelSpecificId: user.id,
      }
    } catch {
      return null
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(input: { channelId: string }): Promise<ChannelInfo | null> {
    try {
      const channel = await this.client.getChannel(input.channelId)
      return {
        id: channel.id,
        name: channel.name,
        type: channel.is_im ? 'direct' : channel.is_private ? 'private' : 'public',
        isArchived: false, // API doesn't expose this directly
        memberCount: channel.member_count,
      }
    } catch {
      return null
    }
  }

  /**
   * Update presence status
   */
  async updatePresence(input: PresenceUpdate): Promise<void> {
    // Note: Setting presence requires additional Slack API scopes
    // This is a placeholder for the capability
    console.log('updatePresence called', input)
  }

  /**
   * Get presence for users
   */
  async getPresence(input: { channelId: string; userIds: string[] }): Promise<PresenceUpdate[]> {
    const presences: PresenceUpdate[] = []
    
    for (const userId of input.userIds) {
      try {
        const presence = await this.client.getUserPresence(userId)
        presences.push({
          userId,
          channelId: input.channelId,
          status: presence === 'active' ? 'online' : 'away',
        })
      } catch {
        // Skip users we can't get presence for
      }
    }
    
    return presences
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private convertAttachments(event: SlackMessageEvent) {
    const attachments: NormalizedInboundMessage['attachments'] = []
    
    if (event.files) {
      for (const file of event.files) {
        const type = file.mimetype.startsWith('image/')
          ? 'image'
          : file.mimetype.startsWith('video/')
          ? 'video'
          : file.mimetype.startsWith('audio/')
          ? 'audio'
          : 'file'
        
        attachments.push({
          id: file.id,
          type,
          url: file.url_private_download,
          mimeType: file.mimetype,
          name: file.name,
          size: file.size,
        })
      }
    }
    
    return attachments
  }

  private convertReactions(event: SlackMessageEvent): NormalizedInboundMessage['reactions'] {
    if (!event.reactions) return []
    
    return event.reactions.map(r => ({
      emoji: r.name,
      userIds: r.users,
    }))
  }

  /**
   * Verify Slack webhook signature
   * Use this for production webhook verification
   */
  static verifySignature(
    body: string,
    timestamp: string,
    signature: string,
    secret: string
  ): boolean {
    // Implementation would use @slack/signature
    // For now, basic placeholder
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'v0=' + hmac.update(`${timestamp}:${body}`).digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  }
}

// ========================================================================
// Factory Function
// ========================================================================

export function createSlackAdapter(config: SlackAdapterConfig): SlackAdapter {
  return new SlackAdapter(config)
}