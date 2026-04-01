/**
 * Composer Capabilities Widget - Injection Configuration
 * 
 * Displays available message composer features based on channel capabilities.
 * Injection spot: composer.toolbar
 */

import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets/injection'
import type { ChannelCapabilities } from '../../lib/capabilities.js'
import ComposerCapabilitiesWidget from './ComposerCapabilitiesWidget'

export interface ComposerCapabilitiesContext {
  channelType: string
  providerKey: string
  organizationId: string
  tenantId: string
  userId?: string
}

export interface ComposerCapabilitiesData {
  capabilities: ChannelCapabilities
}

export interface ComposerCapabilitiesProps {
  channelType: string
  providerKey: string
  capabilities: ChannelCapabilities
  onFileUpload?: () => void
  onAddReaction?: () => void
  onRichFormat?: (format: string) => void
}

/**
 * Icon mapping for capability types
 */
export const CAPABILITY_ICONS: Record<string, string> = {
  fileSharing: '📎',
  reactions: '😀',
  richText: '🔤',
  inlineImages: '🖼️',
  interactiveComponents: '🔘',
  richBlocks: '📋',
  stickers: '💫',
  locationSharing: '📍',
  voiceNotes: '🎤',
  contactCards: '👤',
  threading: '💬',
}

/**
 * Tooltip labels for capabilities
 */
export const CAPABILITY_LABELS: Record<string, string> = {
  fileSharing: 'File sharing',
  reactions: 'Reactions',
  richText: 'Rich text formatting',
  inlineImages: 'Inline images',
  interactiveComponents: 'Interactive components',
  richBlocks: 'Rich blocks',
  stickers: 'Stickers',
  locationSharing: 'Location sharing',
  voiceNotes: 'Voice notes',
  contactCards: 'Contact cards',
  threading: 'Threading',
}

/**
 * Get enabled capabilities as array of keys
 */
export function getEnabledCapabilities(capabilities: ChannelCapabilities): string[] {
  const enabled: string[] = []
  
  const capabilityKeys: (keyof ChannelCapabilities)[] = [
    'fileSharing',
    'reactions',
    'richText',
    'inlineImages',
    'interactiveComponents',
    'richBlocks',
    'stickers',
    'locationSharing',
    'voiceNotes',
    'contactCards',
    'threading',
  ]
  
  for (const key of capabilityKeys) {
    const value = capabilities[key]
    if (typeof value === 'boolean' && value) {
      enabled.push(key)
    }
  }
  
  return enabled
}

const composerCapabilitiesInjection: InjectionWidgetModule<ComposerCapabilitiesContext, ComposerCapabilitiesData> = {
  metadata: {
    id: 'communication-channels.composer-capabilities',
    title: 'Composer Capabilities',
    description: 'Display available message composer features based on channel capabilities',
    priority: 5,
    enabled: true,
  },
  Widget: ComposerCapabilitiesWidget,
  // Override default injection spot
  injectAt: 'composer.toolbar',
}

export default composerCapabilitiesInjection

// Re-export for convenience
export type { ChannelCapabilities }