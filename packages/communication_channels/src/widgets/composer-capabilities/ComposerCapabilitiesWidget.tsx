/**
 * ComposerCapabilitiesWidget - Displays available composer actions based on channel capabilities
 * 
 * Shows icons for features like file upload, reactions, rich text, etc.
 * Only displays capabilities that are enabled for the current channel.
 */

import React from 'react'
import type { ChannelCapabilities } from '../../lib/capabilities.js'
import { CAPABILITY_ICONS, CAPABILITY_LABELS, getEnabledCapabilities } from './composer-capabilities.inject.js'

export interface ComposerCapabilitiesWidgetProps {
  channelType: string
  providerKey: string
  capabilities: ChannelCapabilities
  onFileUpload?: () => void
  onAddReaction?: () => void
  onRichFormat?: (format: string) => void
  className?: string
  variant?: 'default' | 'compact' | 'expanded'
  disabled?: boolean
}

/**
 * Get click handler for capability
 */
function getCapabilityHandler(
  capability: string,
  props: ComposerCapabilitiesWidgetProps
): (() => void) | undefined {
  switch (capability) {
    case 'fileSharing':
      return props.onFileUpload
    case 'reactions':
      return props.onAddReaction
    case 'richText':
      return () => props.onRichFormat?.('toggle')
    default:
      return undefined
  }
}

/**
 * Capability button component
 */
interface CapabilityButtonProps {
  capability: string
  disabled?: boolean
  onClick?: () => void
}

const CapabilityButton: React.FC<CapabilityButtonProps> = ({
  capability,
  disabled = false,
  onClick,
}) => {
  const icon = CAPABILITY_ICONS[capability] || '⚪'
  const label = CAPABILITY_LABELS[capability] || capability

  return (
    <button
      type="button"
      className={`composer-capability-btn ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <span className="capability-icon">{icon}</span>
      <span className="capability-label">{label}</span>
    </button>
  )
}

/**
 * Main ComposerCapabilitiesWidget component
 */
const ComposerCapabilitiesWidget: React.FC<ComposerCapabilitiesWidgetProps> = ({
  channelType,
  providerKey,
  capabilities,
  onFileUpload,
  onAddReaction,
  onRichFormat,
  className = '',
  variant = 'default',
  disabled = false,
}) => {
  const enabledCapabilities = getEnabledCapabilities(capabilities)

  if (enabledCapabilities.length === 0) {
    return null
  }

  const containerClass = `composer-capabilities composer-capabilities--${variant} ${className}`.trim()

  return (
    <div className={containerClass} role="toolbar" aria-label={`${channelType} composer capabilities`}>
      {enabledCapabilities.map((capability) => (
        <CapabilityButton
          key={capability}
          capability={capability}
          disabled={disabled}
          onClick={getCapabilityHandler(capability, {
            channelType,
            providerKey,
            capabilities,
            onFileUpload,
            onAddReaction,
            onRichFormat,
            disabled,
          })}
        />
      ))}
    </div>
  )
}

export default ComposerCapabilitiesWidget