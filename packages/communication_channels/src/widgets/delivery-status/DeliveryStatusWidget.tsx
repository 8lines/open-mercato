/**
 * Delivery Status Widget
 * 
 * Displays delivery status indicator for messages in the Messages module UI.
 */

"use client"

import * as React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'

// Status colors as specified
export const STATUS_COLORS: Record<string, string> = {
  pending: '#9CA3AF',   // szary
  sent: '#3B82F6',     // niebieski
  delivered: '#10B981', // zielony
  failed: '#EF4444',   // czerwony
}

// Status icons
export const STATUS_ICONS: Record<string, string> = {
  pending: '⏳',
  sent: '✓',
  delivered: '✓✓',
  failed: '⚠️',
}

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

interface DeliveryStatusWidgetProps extends InjectionWidgetComponentProps<DeliveryStatusContext, DeliveryStatusData> {
  onRetry?: () => void
}

export function DeliveryStatusWidget({ 
  context, 
  data, 
  disabled,
  onRetry 
}: DeliveryStatusWidgetProps) {
  const status = data?.status ?? 'pending'
  const deliveredAt = data?.deliveredAt
  const failureReason = data?.failureReason

  const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending
  const icon = STATUS_ICONS[status] ?? STATUS_ICONS.pending

  // Format delivery time if available
  const formattedTime = React.useMemo(() => {
    if (!deliveredAt) return null
    const date = new Date(deliveredAt)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }, [deliveredAt])

  // Build tooltip text
  const tooltipText = React.useMemo(() => {
    const parts = [
      status.charAt(0).toUpperCase() + status.slice(1),
    ]
    if (formattedTime) {
      parts.push(`at ${formattedTime}`)
    }
    if (failureReason) {
      parts.push(`- ${failureReason}`)
    }
    return parts.join(' ')
  }, [status, formattedTime, failureReason])

  // Render pending state with spinner
  if (status === 'pending') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 text-xs',
          disabled && 'opacity-50'
        )}
        style={{ color }}
        title={tooltipText}
      >
        <span className="animate-spin mr-1">⏳</span>
        <span className="text-[10px] uppercase tracking-wider">Sending...</span>
      </div>
    )
  }

  // Render failed state with retry option
  if (status === 'failed') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1 text-xs',
          disabled && 'opacity-50'
        )}
        style={{ color }}
        title={tooltipText}
      >
        <span>{icon}</span>
        <span className="text-[10px] uppercase tracking-wider">Failed</span>
        {failureReason && (
          <span className="text-[10px] text-red-600 ml-1" title={failureReason}>
            ⚠️
          </span>
        )}
        {onRetry && !disabled && (
          <button
            onClick={onRetry}
            className="ml-1 text-[10px] underline hover:text-red-700 transition-colors"
            title="Retry sending"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  // Render sent state
  if (status === 'sent') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-0.5 text-xs',
          disabled && 'opacity-50'
        )}
        style={{ color }}
        title={tooltipText}
      >
        <span className="text-sm">{icon}</span>
      </div>
    )
  }

  // Render delivered state (default)
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 text-xs',
        disabled && 'opacity-50'
      )}
      style={{ color }}
      title={tooltipText}
    >
      <span className="text-sm">{icon}</span>
      {formattedTime && (
        <span className="text-[10px] opacity-75">{formattedTime}</span>
      )}
    </div>
  )
}

export default DeliveryStatusWidget
