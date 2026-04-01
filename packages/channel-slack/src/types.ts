/**
 * Slack-specific types for ChannelAdapter
 */

import type {
  InboundMessage,
  NormalizedInboundMessage,
  OutboundMessage,
  SendMessageResult,
} from '../communication_channels/lib/types.js'

// ============================================================================
// Slack-specific types
// ============================================================================

export interface SlackMessageEvent {
  type: 'message'
  channel: string
  ts: string
  thread_ts?: string
  user: string
  text: string
  files?: SlackFile[]
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
  reactions?: Array<{
    name: string
    users: string[]
  }>
  edited?: {
    ts: string
    user: string
  }
  subtype?: string
}

export interface SlackFile {
  id: string
  name: string
  mimetype: string
  url_private: string
  url_private_download: string
  size: number
  preview?: string
}

export interface SlackBlock {
  type: string
  text?: {
    type: 'plain_text' | 'mrkdwn'
    text: string
  }
  elements?: unknown[]
  accessory?: unknown
  block_id?: string
}

export interface SlackAttachment {
  id: string
  color?: string
  fallback?: string
  text?: string
  title?: string
  title_link?: string
  fields?: Array<{
    title: string
    value: string
    short?: boolean
  }>
  image_url?: string
  thumb_url?: string
}

export interface SlackUser {
  id: string
  name: string
  real_name?: string
  profile?: {
    display_name?: string
    real_name?: string
    image_72?: string
    email?: string
  }
  is_bot?: boolean
}

export interface SlackChannel {
  id: string
  name: string
  is_channel: boolean
  is_group: boolean
  is_im: boolean
  is_mpim: boolean
  is_private: boolean
  member_count?: number
  topic?: { value: string }
  purpose?: { value: string }
}

export interface SlackReaction {
  name: string
  users: string[]
  count: number
}

export interface SlackWebhookPayload {
  type: 'url_verification'
  challenge?: string
  type: 'event_callback'
  event?: SlackMessageEvent
  team_id?: string
  api_app_id?: string
}

// ============================================================================
// Slack Adapter Config
// ============================================================================

export interface SlackAdapterConfig {
  botToken: string
  signingSecret: string
  appId?: string
  teamId?: string
  defaultChannel?: string
}

// ============================================================================
// Re-export common types
// ============================================================================

export type {
  InboundMessage,
  NormalizedInboundMessage,
  OutboundMessage,
  SendMessageResult,
}