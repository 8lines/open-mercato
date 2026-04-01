/**
 * WhatsApp Business API Client
 * Handles communication with Meta's WhatsApp Business API
 */

import type { WhatsAppConfig, WhatsAppInboundMessage } from './types.js'

export interface WhatsAppClientConfig {
  phoneNumberId: string
  accessToken: string
  businessAccountId?: string
  apiVersion?: string
}

export interface SendMessageResponse {
  messaging_product: string
  to: string
  type: string
  messages: Array<{
    id: string
    messaging_product: string
  }>
}

export interface SendReactionResponse {
  success: boolean
}

export class WhatsAppClient {
  private phoneNumberId: string
  private accessToken: string
  private businessAccountId?: string
  private apiVersion: string

  private readonly baseUrl = 'https://graph.facebook.com'

  constructor(config: WhatsAppClientConfig) {
    this.phoneNumberId = config.phoneNumberId
    this.accessToken = config.accessToken
    this.businessAccountId = config.businessAccountId
    this.apiVersion = config.apiVersion ?? 'v21.0'
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  async sendMessage(
    recipient: string,
    message: {
      messaging_product: string
      to: string
      type: string
      text?: { body: string; preview_url?: boolean }
      image?: { id?: string; link?: string; caption?: string }
      video?: { id?: string; link?: string; caption?: string }
      audio?: { id?: string; link?: string }
      document?: { id?: string; link?: string; caption?: string; filename?: string }
      sticker?: { id?: string; link?: string }
      location?: { latitude: number; longitude: number; name?: string; address?: string }
      contacts?: Array<{ name: { first_name: string; last_name?: string; formatted_name: string }; phones?: Array<{ phone: string; type?: string; wa_id?: string }> }>
      interactive?: unknown
    }
  ): Promise<SendMessageResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: message.type,
        text: message.text,
        image: message.image,
        video: message.video,
        audio: message.audio,
        document: message.document,
        sticker: message.sticker,
        location: message.location,
        contacts: message.contacts,
        interactive: message.interactive,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async sendReaction(recipient: string, messageId: string, emoji: string): Promise<SendReactionResponse> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'reaction',
        reaction: {
          message_id: messageId,
          emoji: emoji,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${error}`)
    }

    return { success: true }
  }

  async getMessageStatus(messageId: string): Promise<{
    id: string
    status: string
    timestamp: string
  }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${messageId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async markAsRead(messageId: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${error}`)
    }

    return { success: true }
  }

  async uploadMedia(mediaUrl: string, mimeType: string): Promise<{ id: string }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/media`

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        type: mimeType,
        url: mediaUrl,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${error}`)
    }

    return response.json()
  }

  async downloadMedia(mediaId: string): Promise<{ url: string }> {
    const url = `${this.baseUrl}/${this.apiVersion}/${mediaId}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`WhatsApp API error: ${response.status} ${error}`)
    }

    return response.json()
  }
}
