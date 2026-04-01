/**
 * Slack Client wrapper for Web API
 */

import { WebClient, LogLevel } from '@slack/web-api'
import type { SlackAdapterConfig, SlackMessageEvent, SlackUser, SlackChannel, SlackReaction } from './types.js'

export class SlackClient {
  private client: WebClient

  constructor(config: SlackAdapterConfig) {
    this.client = new WebClient(config.botToken, {
      logLevel: LogLevel.WARN,
    })
  }

  /**
   * Post a message to a channel
   */
  async postMessage(params: {
    channel: string
    text?: string
    blocks?: unknown[]
    attachments?: unknown[]
    threadTs?: string
    unfurlLinks?: boolean
    replyBroadcast?: boolean
  }): Promise<{ ts: string; channel: string; message?: unknown }> {
    const result = await this.client.chat.postMessage({
      channel: params.channel,
      text: params.text,
      blocks: params.blocks,
      attachments: params.attachments,
      thread_ts: params.threadTs,
      unfurl_links: params.unfurlLinks,
      reply_broadcast: params.replyBroadcast,
    })

    return {
      ts: result.ts!,
      channel: result.channel!,
      message: result.message,
    }
  }

  /**
   * Update an existing message
   */
  async updateMessage(params: {
    channel: string
    ts: string
    text?: string
    blocks?: unknown[]
    attachments?: unknown[]
  }): Promise<{ ts: string; channel: string }> {
    const result = await this.client.chat.update({
      channel: params.channel,
      ts: params.ts,
      text: params.text,
      blocks: params.blocks,
      attachments: params.attachments,
    })

    return {
      ts: result.ts!,
      channel: result.channel!,
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(params: {
    channel: string
    ts: string
  }): Promise<void> {
    await this.client.chat.delete({
      channel: params.channel,
      ts: params.ts,
    })
  }

  /**
   * Add a reaction to a message
   */
  async addReaction(params: {
    channel: string
    ts: string
    name: string
  }): Promise<void> {
    await this.client.reactions.add({
      channel: params.channel,
      timestamp: params.ts,
      name: params.name,
    })
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(params: {
    channel: string
    ts: string
    name: string
  }): Promise<void> {
    await this.client.reactions.remove({
      channel: params.channel,
      timestamp: params.ts,
      name: params.name,
    })
  }

  /**
   * Get user info
   */
  async getUser(userId: string): Promise<SlackUser> {
    const result = await this.client.users.info({
      user: userId,
    })
    return result.user as SlackUser
  }

  /**
   * Get channel info
   */
  async getChannel(channelId: string): Promise<SlackChannel> {
    const result = await this.client.conversations.info({
      channel: channelId,
    })
    return result.channel as SlackChannel
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(params: {
    channel: string
    latest?: string
    oldest?: string
    limit?: number
    inclusive?: boolean
  }): Promise<{
    messages: SlackMessageEvent[]
    hasMore: boolean
    nextCursor?: string
  }> {
    const result = await this.client.conversations.history({
      channel: params.channel,
      latest: params.latest,
      oldest: params.oldest,
      limit: params.limit,
      inclusive: params.inclusive,
    })

    return {
      messages: (result.messages || []) as SlackMessageEvent[],
      hasMore: result.has_more || false,
      nextCursor: result.response_metadata?.next_cursor,
    }
  }

  /**
   * Get thread replies
   */
  async getThreadReplies(params: {
    channel: string
    ts: string
    limit?: number
  }): Promise<SlackMessageEvent[]> {
    const result = await this.client.conversations.replies({
      channel: params.channel,
      ts: params.ts,
      limit: params.limit,
    })

    return (result.messages || []) as SlackMessageEvent[]
  }

  /**
   * Upload a file
   */
  async uploadFile(params: {
    channel: string
    file: Buffer | ReadableStream
    filename?: string
    title?: string
    initialComment?: string
    threadTs?: string
  }): Promise<{ file: unknown }> {
    const result = await this.client.files.uploadV2({
      channel_ids: params.channel,
      file: params.file,
      filename: params.filename,
      title: params.title,
      initial_comment: params.initialComment,
      thread_ts: params.threadTs,
    })

    return { file: result.file }
  }

  /**
   * Get file info
   */
  async getFile(fileId: string): Promise<unknown> {
    const result = await this.client.files.info({
      file: fileId,
    })
    return result.file
  }

  /**
   * Get user presence
   */
  async getUserPresence(userId: string): Promise<'active' | 'away'> {
    const result = await this.client.users.getPresence({
      user: userId,
    })
    return (result.presence || 'away') as 'active' | 'away'
  }

  /**
   * Set user status
   */
  async setUserStatus(params: {
    statusText?: string
    statusEmoji?: string
  }): Promise<void> {
    // Note: This requires additional scopes
    // await this.client.users.profile.set(...)
  }

  /**
   * List emoji reactions for a message
   */
  async getMessageReactions(params: {
    channel: string
    ts: string
  }): Promise<SlackReaction[]> {
    const result = await this.client.reactions.get({
      channel: params.channel,
      timestamp: params.ts,
    })

    return (result.message?.reactions || []) as SlackReaction[]
  }
}