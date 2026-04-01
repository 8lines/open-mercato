/**
 * Channel Badge Widget - Injection Configuration
 * 
 * This widget integrates with the Messages module UI to display
 * channel information badges next to messages.
 */

import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets/injection'
import ChannelBadgeWidget from './ChannelBadgeWidget'

export interface ChannelBadgeContext {
  messageId: string
  organizationId: string
  tenantId: string
}

export interface ChannelBadgeData {
  type: string
  providerKey?: string
  name?: string
}

const channelBadgeInjection: InjectionWidgetModule<ChannelBadgeContext, ChannelBadgeData> = {
  metadata: {
    id: 'communication-channels.channel-badge',
    title: 'Channel Badge',
    description: 'Display channel icon and name badge on messages',
    priority: 1, // High priority - show near message header
    enabled: true,
  },
  Widget: ChannelBadgeWidget,
}

export default channelBadgeInjection