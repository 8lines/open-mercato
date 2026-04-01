/**
 * Message enricher for Slack messages
 * Adds additional context and metadata to messages
 */

import type { NormalizedInboundMessage } from '../communication_channels/lib/types.js'
import type { SlackMessageEvent, SlackUser } from './types.js'

export interface EnrichedMessage extends NormalizedInboundMessage {
  slackSpecific?: {
    isAppMention: boolean
    isThreadReply: boolean
    isEdited: boolean
    permalink?: string
    rawBlocks?: unknown[]
    rawEvent: SlackMessageEvent
  }
}

export class MessageEnricher {
  /**
   * Enrich a normalized message with Slack-specific data
   */
  async enrich(
    message: NormalizedInboundMessage,
    rawEvent: SlackMessageEvent,
    user?: SlackUser
  ): Promise<EnrichedMessage> {
    const enriched: EnrichedMessage = {
      ...message,
      slackSpecific: {
        isAppMention: this.isAppMention(rawEvent),
        isThreadReply: !!rawEvent.thread_ts && rawEvent.thread_ts !== rawEvent.ts,
        isEdited: !!rawEvent.edited,
        rawBlocks: rawEvent.blocks,
        rawEvent: rawEvent,
      },
    }

    // Add user info if available
    if (user) {
      enriched.metadata = {
        ...enriched.metadata,
        senderName: user.real_name || user.name,
        senderAvatar: user.profile?.image_72,
        senderEmail: user.profile?.email,
        isBot: user.is_bot || false,
      }
    }

    return enriched
  }

  /**
   * Check if message mentions the app
   */
  private isAppMention(event: SlackMessageEvent): boolean {
    // Check if text contains @app mention
    // This is a simplified check - real implementation would check event.subtype
    return event.subtype === 'appMention'
  }

  /**
   * Extract thread info from event
   */
  extractThreadInfo(event: SlackMessageEvent): {
    isThreadParent: boolean
    threadId?: string
  } {
    const threadTs = event.thread_ts
    const ts = event.ts

    // If thread_ts equals ts, this is the parent of a thread
    const isThreadParent = threadTs === ts

    return {
      isThreadParent,
      threadId: threadTs && threadTs !== ts ? threadTs : undefined,
    }
  }

  /**
   * Check if message has attachments/files
   */
  hasAttachments(event: SlackMessageEvent): boolean {
    return !!(event.files?.length || event.attachments?.length)
  }

  /**
   * Extract file info from event
   */
  extractFiles(event: SlackMessageEvent): Array<{
    id: string
    name: string
    mimeType: string
    url: string
    size: number
  }> {
    const files: Array<{
      id: string
      name: string
      mimeType: string
      url: string
      size: number
    }> = []

    if (event.files) {
      for (const file of event.files) {
        files.push({
          id: file.id,
          name: file.name,
          mimeType: file.mimetype,
          url: file.url_private_download,
          size: file.size,
        })
      }
    }

    return files
  }
}