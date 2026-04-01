/**
 * Reaction Bar Widget Exports
 * 
 * Provides message reactions UI for the Messages module.
 */

export { default as reactionBarInjection, type ReactionBarContext, type ReactionBarData } from './reaction-bar.inject.js'
export { ReactionBarWidget } from './ReactionBarWidget.js'
export { enrichMessagesWithReactions, hasReactions, getReactionUserIds } from './reaction-bar.enricher.js'
export type { GroupedReaction, ReactionEnricherInput, ReactionEnricherOutput } from './reaction-bar.enricher.js'
export type { GroupedReaction as ReactionBarGroupedReaction } from './reaction-bar.inject.js'