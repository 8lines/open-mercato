/**
 * Channel Badge Widget Exports
 * 
 * Provides channel badge UI for the Messages module.
 */

export { default as channelBadgeInjection, type ChannelBadgeContext, type ChannelBadgeData } from './channel-badge.inject.js'
export { ChannelBadgeWidget, CHANNEL_COLORS, CHANNEL_ICONS, CHANNEL_BADGE_SIZES } from './ChannelBadgeWidget.js'
export { enrichMessagesWithChannel, getChannelInfo, hasChannelInfo, type ChannelInfo } from './channel-badge.enricher.js'
export type { ChannelEnricherInput, ChannelEnricherOutput } from './channel-badge.enricher.js'