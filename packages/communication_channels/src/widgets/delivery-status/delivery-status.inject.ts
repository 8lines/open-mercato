/**
 * Delivery Status Widget - Injection Configuration
 * 
 * This widget integrates with the Messages module UI to display
 * delivery status indicators next to messages.
 */

import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets/injection'
import DeliveryStatusWidget from './DeliveryStatusWidget'

export interface DeliveryStatusContext {
  messageId: string
  organizationId: string
  tenantId: string
}

export interface DeliveryStatusData {
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  deliveredAt?: Date
  failureReason?: string
}

const deliveryStatusInjection: InjectionWidgetModule<DeliveryStatusContext, DeliveryStatusData> = {
  metadata: {
    id: 'communication-channels.delivery-status',
    title: 'Delivery Status',
    description: 'Display delivery status indicator on messages',
    priority: 20, // Show after channel badge (priority 1)
    enabled: true,
  },
  Widget: DeliveryStatusWidget,
}

export default deliveryStatusInjection
