/**
 * @open-mercato/channel-slack
 * Slack channel adapter for Open Mercato communication channels
 * 
 * Based on SPEC-045d Phase 6
 */

// ========================================================================
// Adapter
// ========================================================================

export { SlackAdapter, createSlackAdapter } from './SlackAdapter.js'

// ========================================================================
// Client
// ========================================================================

export { SlackClient } from './SlackClient.js'

// ========================================================================
// Types
// ========================================================================

export type {
  SlackAdapterConfig,
  SlackMessageEvent,
  SlackFile,
  SlackBlock,
  SlackAttachment,
  SlackUser,
  SlackChannel,
  SlackReaction,
  SlackWebhookPayload,
} from './types.js'

// Re-export common types from communication-channels
export type {
  InboundMessage,
  NormalizedInboundMessage,
  OutboundMessage,
  SendMessageResult,
  ConvertOutboundInput,
  ChannelNativeContent,
  SendReactionInput,
  RemoveReactionInput,
  EditChannelMessageInput,
  DeleteChannelMessageInput,
  FetchHistoryInput,
  HistoryPage,
  ResolveContactInput,
  ContactHint,
  PresenceUpdate,
  ChannelInfo,
} from '../communication_channels/lib/types.js'

// ========================================================================
// Capabilities
// ========================================================================

export { FULL_SLACK_CAPABILITIES } from './capabilities.js'

// ========================================================================
// Converters
// ========================================================================

export { convertBlocksToMarkdown } from './converters/blocks-to-markdown.js'
export { convertMarkdownToBlocks } from './converters/markdown-to-blocks.js'

// ========================================================================
// Enrichers
// ========================================================================

export { MessageEnricher, type EnrichedMessage } from './enrichers/message.enricher.js'

// ========================================================================
// Widgets (React components)
// ========================================================================

export { BlockKitRenderer } from './widgets/BlockKitRenderer.js'
export type { BlockKitRendererProps } from './widgets/BlockKitRenderer.js'