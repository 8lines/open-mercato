/**
 * Channel Info Panel Widget - Injection Configuration
 * 
 * This widget integrates with the Messages detail panel sidebar.
 */

import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets/injection'
import ChannelInfoPanelWidget from './ChannelInfoPanelWidget'

export interface ChannelInfoPanelContext {
  channelId: string
  organizationId: string
  tenantId: string
}

export interface ChannelInfoPanelData {
  channelType: string
  providerKey?: string
  channelName?: string
  externalConversationId?: string
  threadInfo?: {
    threadId?: string
    messageCount?: number
    participantCount?: number
  }
  linkedContact?: {
    id: string
    name: string
    email?: string
    phone?: string
  } | null
  lastActivityAt?: string
  capabilities?: {
    files?: boolean
    richText?: boolean
    mentions?: boolean
    threads?: boolean
    reactions?: boolean
    polls?: boolean
    stickers?: boolean
    voice?: boolean
    video?: boolean
    integrations?: boolean
  }
}

const channelInfoPanelInjection: InjectionWidgetModule<ChannelInfoPanelContext, ChannelInfoPanelData> = {
  metadata: {
    id: 'communication-channels.channel-info-panel',
    title: 'Channel Info',
    description: 'Display channel information in message detail sidebar',
    priority: 10,
    enabled: true,
  },
  Widget: ChannelInfoPanelWidget,
}

export default channelInfoPanelInjection