/**
 * Email v2 Types
 * Based on SPEC-045d Phase 7
 */

import type { ChannelCapabilities } from '@open-mercato/communication_channels'

// ============================================================================
// Email-specific types
// ============================================================================

export interface EmailAddress {
  address: string
  name?: string
}

export interface EmailAttachment {
  filename: string
  contentType: string
  size: number
  content?: Buffer
  url?: string
}

export interface EmailHeaders {
  messageId?: string
  inReplyTo?: string
  references?: string
  subject?: string
  from?: EmailAddress
  to?: EmailAddress[]
  cc?: EmailAddress[]
  bcc?: EmailAddress[]
  date?: Date
  returnPath?: string
}

export interface EmailThreadMapping {
  messageId: string
  threadId: string
  subject: string
  from: string
  date: Date
}

// ============================================================================
// Email Adapter Configuration
// ============================================================================

export interface EmailAdapterConfig {
  /** SMTP configuration for sending */
  smtp?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  
  /** IMAP configuration for receiving (optional) */
  imap?: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  
  /** Default sender address */
  defaultFrom?: string
  
  /** Webhook URL for inbound email (alternative to IMAP) */
  inboundWebhookUrl?: string
  
  /** Secret for webhook verification */
  webhookSecret?: string
}

export interface EmailOutboundMessage {
  from: string | EmailAddress
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
  headers?: Record<string, string>
}

export interface EmailInboundMessage {
  raw: string // Raw email source
  headers: EmailHeaders
  from: EmailAddress
  to: EmailAddress[]
  cc?: EmailAddress[]
  subject: string
  text?: string
  html?: string
  attachments: EmailAttachment[]
  timestamp: Date
}

// ============================================================================
// Threading types
// ============================================================================

export interface ThreadingConfig {
  /** How to match threads: 'headers' (In-Reply-To/References) or 'subject' (Subject matching) */
  mode: 'headers' | 'subject' | 'hybrid'
  
  /** Subject prefix to strip (e.g., "Re: ", "Fwd: ") */
  subjectPrefixes?: string[]
  
  /** Time window for subject-based matching (in minutes) */
  subjectMatchWindow?: number
}

export interface ThreadMatchResult {
  threadId: string | null
  isReply: boolean
  parentMessageId?: string
}
