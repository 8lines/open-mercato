/**
 * Delivery Status Data Enricher
 * 
 * Enriches message list responses with delivery status information
 * for display in the DeliveryStatusWidget.
 */

import type { NormalizedInboundMessage } from '../../lib/types.js'

export interface DeliveryStatusInfo {
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  deliveredAt?: Date
  failureReason?: string
}

export interface DeliveryStatusEnricherInput {
  messages: NormalizedInboundMessage[]
}

export interface DeliveryStatusEnricherOutput {
  messages: (NormalizedInboundMessage & { _deliveryStatus: DeliveryStatusInfo | null })[]
}

/**
 * Enrich messages with delivery status information
 * Extracts delivery status from message metadata
 */
export function enrichMessagesWithDeliveryStatus(input: DeliveryStatusEnricherInput): DeliveryStatusEnricherOutput {
  const { messages } = input

  const enrichedMessages = messages.map((message) => {
    // Extract delivery status from metadata
    const metadata = message.metadata ?? {}
    const deliveryStatus = metadata._deliveryStatus as DeliveryStatusInfo | undefined

    return {
      ...message,
      _deliveryStatus: deliveryStatus ?? null,
    }
  })

  return { messages: enrichedMessages }
}

/**
 * Get delivery status from a message if available
 */
export function getDeliveryStatus(message: NormalizedInboundMessage): DeliveryStatusInfo | null {
  return (message as NormalizedInboundMessage & { _deliveryStatus?: DeliveryStatusInfo | null })._deliveryStatus ?? null
}

/**
 * Check if a message has delivery status
 */
export function hasDeliveryStatus(message: NormalizedInboundMessage): boolean {
  const msg = message as NormalizedInboundMessage & { _deliveryStatus?: DeliveryStatusInfo | null }
  return msg._deliveryStatus !== undefined && msg._deliveryStatus !== null
}
