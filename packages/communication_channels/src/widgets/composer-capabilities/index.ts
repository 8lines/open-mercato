/**
 * Composer Capabilities Widget Exports
 * 
 * Provides composer toolbar capabilities UI based on channel features.
 */

export { 
  default as composerCapabilitiesInjection, 
  type ComposerCapabilitiesContext, 
  type ComposerCapabilitiesData,
  type ComposerCapabilitiesProps,
  CAPABILITY_ICONS,
  CAPABILITY_LABELS,
  getEnabledCapabilities,
} from './composer-capabilities.inject.js'

export { ComposerCapabilitiesWidget } from './ComposerCapabilitiesWidget.js'

// Re-export ChannelCapabilities for consumers
export type { ChannelCapabilities } from '../../lib/capabilities.js'