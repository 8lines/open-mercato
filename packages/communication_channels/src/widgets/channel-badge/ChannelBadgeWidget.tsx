/**
 * Channel Badge Widget
 * 
 * Displays channel icon/name badge for messages in the Messages module UI.
 */

"use client"

import * as React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'

// Channel type colors mapping
export const CHANNEL_COLORS: Record<string, string> = {
  slack: '#4A154B',
  whatsapp: '#25D366',
  telegram: '#0088CC',
  email: '#EA4335',
  sms: '#6B4C9A',
  discord: '#5865F2',
  msteams: '#6264A7',
  messenger: '#0084FF',
  instagram: '#E4405F',
  twitter: '#1DA1F2',
  viber: '#7360F2',
  line: '#00B900',
  signal: '#3A76DF',
  skype: '#00AFF0',
}

// Channel type icons (emoji as fallback)
export const CHANNEL_ICONS: Record<string, string> = {
  slack: '💼',
  whatsapp: '💬',
  telegram: '✈️',
  email: '📧',
  sms: '📱',
  discord: '🎮',
  msteams: '👥',
  messenger: '💬',
  instagram: '📸',
  twitter: '🐦',
  viber: '💬',
  line: '💚',
  signal: '🔒',
  skype: '💬',
}

// Size configurations
export const CHANNEL_BADGE_SIZES = {
  sm: {
    container: 'h-5 text-xs px-1.5',
    icon: 'text-xs',
    text: 'text-xs',
  },
  md: {
    container: 'h-6 text-sm px-2',
    icon: 'text-sm',
    text: 'text-sm',
  },
}

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

interface ChannelBadgeWidgetProps extends InjectionWidgetComponentProps<ChannelBadgeContext, ChannelBadgeData> {}

export function ChannelBadgeWidget({ context, data, disabled }: ChannelBadgeWidgetProps) {
  const channelType = data?.type ?? 'unknown'
  const providerKey = data?.providerKey
  const channelName = data?.name
  const size: 'sm' | 'md' = 'sm' // Default to small

  const color = CHANNEL_COLORS[channelType.toLowerCase()] ?? CHANNEL_COLORS.slack
  const icon = CHANNEL_ICONS[channelType.toLowerCase()] ?? '💬'
  const sizeConfig = CHANNEL_BADGE_SIZES[size]

  // Build tooltip text
  const tooltipText = React.useMemo(() => {
    const parts = [
      channelType.charAt(0).toUpperCase() + channelType.slice(1),
    ]
    if (providerKey) {
      parts.push(`(${providerKey})`)
    }
    if (channelName) {
      parts.push(`- ${channelName}`)
    }
    return parts.join(' ')
  }, [channelType, providerKey, channelName])

  if (channelType === 'unknown' || !data) {
    return null
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded font-medium',
        sizeConfig.container,
        disabled && 'opacity-50'
      )}
      style={{ backgroundColor: `${color}20`, color }}
      title={tooltipText}
    >
      <span className={sizeConfig.icon}>{icon}</span>
      {size === 'md' && channelName && (
        <span className={cn('truncate max-w-[100px]', sizeConfig.text)}>
          {channelName}
        </span>
      )}
    </div>
  )
}

export default ChannelBadgeWidget