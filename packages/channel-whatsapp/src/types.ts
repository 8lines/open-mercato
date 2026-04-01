/**
 * WhatsApp v2 Types
 * Based on SPEC-045d Phase 7
 */

import type { ChannelCapabilities } from '@open-mercato/communication_channels'

// ============================================================================
// WhatsApp-specific types
// ============================================================================

export interface WhatsAppInteractiveButtons {
  type: 'button'
  header?: string
  body: string
  footer?: string
  buttons: Array<{
    id: string
    title: string
  }>
}

export interface WhatsAppInteractiveList {
  type: 'list'
  title: string
  button: string
  sections: Array<{
    title: string
    rows: Array<{
      id: string
      title: string
      description?: string
    }>
  }>
}

export interface WhatsAppInteractiveMessage {
  type: 'button' | 'list'
  header?: string
  body: string
  footer?: string
  buttons?: Array<{
    id: string
    title: string
  }>
  title?: string // for list
  button?: string // for list
  sections?: Array<{
    title: string
    rows: Array<{
      id: string
      title: string
      description?: string
    }>
  }>
}

export interface WhatsAppContact {
  name: {
    first_name: string
    last_name?: string
    formatted_name: string
  }
  phones?: Array<{
    phone: string
    type?: string
    wa_id?: string
  }>
  emails?: Array<{
    email: string
    type?: string
  }>
}

export interface WhatsAppLocation {
  latitude: number
  longitude: number
  name?: string
  address?: string
}

export interface WhatsAppReaction {
  emoji: string
  messageId: string
}

// ============================================================================
// WhatsApp API types
// ============================================================================

export interface WhatsAppConfig {
  phoneNumberId: string
  accessToken: string
  businessAccountId?: string
  verifyToken?: string
}

export interface WhatsAppOutboundMessage {
  messaging_product: 'whatsapp'
  to: string
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts' | 'interactive'
  text?: {
    body: string
    preview_url?: boolean
  }
  image?: {
    id?: string
    link?: string
    caption?: string
  }
  video?: {
    id?: string
    link?: string
    caption?: string
  }
  audio?: {
    id?: string
    link?: string
  }
  document?: {
    id?: string
    link?: string
    caption?: string
    filename?: string
  }
  sticker?: {
    id?: string
    link?: string
  }
  location?: {
    latitude: number
    longitude: number
    name?: string
    address?: string
  }
  contacts?: Array<WhatsAppContact>
  interactive?: WhatsAppInteractiveMessage
}

export interface WhatsAppInboundMessage {
  object: 'whatsapp_business_account'
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: 'whatsapp'
        metadata: {
          display_phone_number: string
          phone_number_id: string
        }
        messages?: Array<{
          from: string
          id: string
          timestamp: string
          type: 'text' | 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'location' | 'contacts' | 'reaction' | 'interactive' | 'order' | 'system'
          text?: {
            body: string
          }
          image?: {
            id: string
            mime_type: string
            sha256: string
            caption?: string
          }
          video?: {
            id: string
            mime_type: string
            sha256: string
            caption?: string
          }
          audio?: {
            id: string
            mime_type: string
            sha256: string
          }
          document?: {
            id: string
            mime_type: string
            sha256: string
            filename: string
            caption?: string
          }
          sticker?: {
            id: string
            mime_type: string
            sha256: string
          }
          location?: {
            latitude: number
            longitude: number
            name?: string
            address?: string
          }
          contacts?: Array<WhatsAppContact>
          reaction?: {
            message_id: string
            emoji: string
          }
          interactive?: {
            type: 'button_reply' | 'list_reply'
            button_reply?: {
              id: string
              title: string
            }
            list_reply?: {
              id: string
              title: string
              description?: string
            }
          }
          system?: {
            type: string
            value: string
          }
          order?: {
            product_id: string
            quantity: number
          }
        }>
        statuses?: Array<{
          id: string
          status: 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered'
          timestamp: string
          recipient_id: string
          conversation?: {
            id: string
            expiration_timestamp: string
          }
          error?: {
            code: number
            title: string
            message: string
            error_data?: {
              product: string
              details: string
            }
          }
        }>
      }
      field: string
    }>
  }>
}

// ============================================================================
// WhatsApp Adapter Configuration
// ============================================================================

export interface WhatsAppAdapterConfig {
  phoneNumberId: string
  accessToken: string
  businessAccountId?: string
  verifyToken?: string
  apiVersion?: string
}
