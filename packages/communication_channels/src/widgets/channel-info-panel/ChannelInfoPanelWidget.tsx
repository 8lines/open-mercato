/**
 * Channel Info Panel Widget
 * 
 * Displays detailed channel information in the message detail sidebar.
 */

"use client"

import * as React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'
import { formatRelativeTime } from '@open-mercato/shared/lib/time'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'
import { CHANNEL_COLORS, CHANNEL_ICONS } from '../channel-badge/ChannelBadgeWidget'

// Channel capabilities mapping
interface ChannelCapabilities {
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
  capabilities?: ChannelCapabilities
}

interface ChannelInfoPanelWidgetProps extends InjectionWidgetComponentProps<ChannelInfoPanelContext, ChannelInfoPanelData> {}

export function ChannelInfoPanelWidget({ context, data, disabled }: ChannelInfoPanelWidgetProps) {
  const channelType = data?.channelType ?? 'unknown'
  const channelName = data?.channelName
  const externalConversationId = data?.externalConversationId
  const threadInfo = data?.threadInfo
  const linkedContact = data?.linkedContact
  const lastActivityAt = data?.lastActivityAt
  const capabilities = data?.capabilities

  const color = CHANNEL_COLORS[channelType.toLowerCase()] ?? '#6B7280'
  const icon = CHANNEL_ICONS[channelType.toLowerCase()] ?? '💬'

  const capabilityList = React.useMemo(() => {
    if (!capabilities) return []
    return Object.entries(capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key)
  }, [capabilities])

  const formatCapability = (cap: string): string => {
    const labels: Record<string, string> = {
      files: 'Files',
      richText: 'Rich text',
      mentions: '@mentions',
      threads: 'Threads',
      reactions: 'Reactions',
      polls: 'Polls',
      stickers: 'Stickers',
      voice: 'Voice',
      video: 'Video',
      integrations: 'Integrations',
    }
    return labels[cap] ?? cap
  }

  const renderValue = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )

  return (
    <div className={cn('space-y-4', disabled && 'opacity-50')}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">
            {channelName || channelType.charAt(0).toUpperCase() + channelType.slice(1)}
          </h3>
          <p className="text-xs text-muted-foreground capitalize">{channelType}</p>
        </div>
      </div>

      {/* Conversation Info */}
      {(externalConversationId || threadInfo) && (
        <div className="space-y-1 border-t pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Conversation
          </h4>
          {externalConversationId && renderValue('ID', externalConversationId)}
          {threadInfo?.messageCount !== undefined && renderValue('Messages', threadInfo.messageCount)}
          {threadInfo?.participantCount !== undefined && renderValue('Participants', threadInfo.participantCount)}
        </div>
      )}

      {/* Linked Contact */}
      {linkedContact && (
        <div className="space-y-1 border-t pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Linked Contact
          </h4>
          <div className="rounded border p-2 space-y-1">
            <p className="font-medium text-sm">{linkedContact.name}</p>
            {linkedContact.email && <p className="text-xs text-muted-foreground">{linkedContact.email}</p>}
            {linkedContact.phone && <p className="text-xs text-muted-foreground">{linkedContact.phone}</p>}
          </div>
        </div>
      )}

      {/* Capabilities */}
      {capabilityList.length > 0 && (
        <div className="space-y-1 border-t pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Capabilities
          </h4>
          <div className="flex flex-wrap gap-1">
            {capabilityList.map((cap) => (
              <span
                key={cap}
                className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs"
              >
                {formatCapability(cap)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Last Activity */}
      {lastActivityAt && (
        <div className="space-y-1 border-t pt-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Last Activity
          </h4>
          <p className="text-sm">{formatRelativeTime(new Date(lastActivityAt))}</p>
        </div>
      )}
    </div>
  )
}

export default ChannelInfoPanelWidget