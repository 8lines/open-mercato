// Communication Channels Module
// Exports for external consumption

// Entities
export {
  MessageChannelLink,
  ChannelThreadMapping,
  MessageReaction,
} from './data/entities.js'

// Validators
export {
  CHANNEL_TYPES,
  DELIVERY_STATUSES,
  type ChannelType,
  type DeliveryStatus,
  messageChannelLinkSchema,
  createMessageChannelLinkSchema,
  updateMessageChannelLinkSchema,
  channelThreadMappingSchema,
  createChannelThreadMappingSchema,
  updateChannelThreadMappingSchema,
  type CreateMessageChannelLinkInput,
  type UpdateMessageChannelLinkInput,
  type CreateChannelThreadMappingInput,
  type UpdateChannelThreadMappingInput,
  messageReactionSchema,
  createMessageReactionSchema,
  updateMessageReactionSchema,
  type CreateMessageReactionInput,
  type UpdateMessageReactionInput,
} from './data/validators.js'

// Re-export entities and validators from data
export * from './data/entities.js'
export * from './data/validators.js'

// ============================================================================
// Workers
// ============================================================================

// Inbound Message Worker
export {
  type InboundMessageJob,
  metadata as inboundMessageWorkerMetadata,
  inboundMessageHandler,
} from './workers/inbound-message.worker.js'

// Reaction Worker
export {
  type InboundReactionJob,
  type OutboundReactionJob,
  type ReactionJob,
  metadata as reactionWorkerMetadata,
  reactionHandler,
  createInboundReactionJob,
  createOutboundReactionJob,
} from './workers/reaction.worker.js'

// ============================================================================
// Subscribers
// ============================================================================

// Outbound Delivery Subscriber
export {
  type MessageSentEvent,
  outboundDeliverySubscriber,
  metadata as outboundDeliverySubscriberMetadata,
  onMessageSent,
} from './subscribers/outbound-delivery.subscriber.js'

// ============================================================================
// Migrations
// ============================================================================

export { Migration20260401120000 } from './migrations/Migration20260401120000.js'
export { Migration20260401130000 } from './migrations/Migration20260401130000.js'
export { Migration20260401140000 } from './migrations/Migration20260401140000.js'

export { Migration20260401150000 } from './migrations/Migration20260401150000.js'

// ============================================================================
// Channel Adapter v2 (SPEC-045d)
// ============================================================================

// Capabilities
export {
  type ChannelCapabilities,
  DEFAULT_CAPABILITIES,
  FULL_CAPABILITIES,
  EMAIL_CAPABILITIES,
} from './lib/capabilities.js'

// Types
export {
  // Message Types
  type InboundMessage,
  type NormalizedInboundMessage,
  type OutboundMessage,
  type ConvertOutboundInput,
  type ChannelNativeContent,
  // Reaction Types
  type SendReactionInput,
  type RemoveReactionInput,
  // Message Edit/Delete Types
  type EditChannelMessageInput,
  type DeleteChannelMessageInput,
  // History Types
  type FetchHistoryInput,
  type HistoryPage,
  // Contact Types
  type ResolveContactInput,
  type ContactHint,
  // Presence Types
  type PresenceStatus,
  type PresenceUpdate,
  // Channel Types
  type ChannelInfo,
  type SendMessageResult,
  // V1 Types (backward compatible)
  type MessageSendInput,
  type MessageReceivePayload,
} from './lib/types.js'

// Adapter
export {
  type ChannelAdapterV1,
  type ChannelAdapterV2,
  isChannelAdapterV2,
  supportsReactions,
  supportsMessageEdit,
  supportsMessageDelete,
  supportsHistory,
  supportsPresence,
  createAdapterWithCapabilities,
} from './lib/adapter.js'

// Registry
export {
  // v1 (backward compatible)
  registerChannelAdapter,
  getChannelAdapter,
  listChannelAdapters,
  // v2
  registerAdapter,
  getAdapter,
  getCapabilities,
  resolveCapabilities,
  listAdapters,
  listProviderKeys,
  clearAdapters,
  hasAdapter,
  getAdapterCount,
  // Utilities
  findAdaptersByCapability,
  findAdaptersWithReactions,
  findAdaptersWithMessageEdit,
  findAdaptersWithFileSharing,
  findAdaptersByBodyFormat,
} from './lib/registry.js'

// ============================================================================
// Content Types (SPEC-046)
// ============================================================================

// Content Type Taxonomy
export {
  // Slack Types
  SLACK_BLOCKS,
  SLACK_MESSAGE,
  SLACK_ATTACHMENTS,
  SLACK_CONTENT_TYPES,
  // WhatsApp Types
  WHATSAPP_TEXT,
  WHATSAPP_INTERACTIVE,
  WHATSAPP_IMAGE,
  WHATSAPP_VIDEO,
  WHATSAPP_AUDIO,
  WHATSAPP_DOCUMENT,
  WHATSAPP_CONTACT,
  WHATSAPP_LOCATION,
  WHATSAPP_STICKER,
  WHATSAPP_CONTENT_TYPES,
  // Telegram Types
  TELEGRAM_TEXT,
  TELEGRAM_PHOTO,
  TELEGRAM_VIDEO,
  TELEGRAM_AUDIO,
  TELEGRAM_VOICE,
  TELEGRAM_DOCUMENT,
  TELEGRAM_STICKER,
  TELEGRAM_LOCATION,
  TELEGRAM_CONTACT,
  TELEGRAM_CONTENT_TYPES,
  // Email Types
  EMAIL_PLAIN,
  EMAIL_HTML,
  EMAIL_MIME,
  EMAIL_CONTENT_TYPES,
  // Generic Types
  TEXT_PLAIN,
  TEXT_MARKDOWN,
  APPLICATION_JSON,
  // Interfaces
  type ContentTypeDetector,
  type MessageContentRenderer,
  // Helper Functions
  isSlackContent,
  isWhatsAppContent,
  isTelegramContent,
  isEmailContent,
  parseContentType,
  hasRenderer,
  getSupportedTypes,
  // Registry Functions
  registerContentTypeDetector,
  getContentTypeDetector,
  registerContentTypeRenderer,
  getContentTypeRenderer,
  registerDefaultContentTypeDetector,
  getDefaultContentTypeDetector,
  clearContentTypeRegistry,
  listRegisteredProviders,
} from './lib/content-types.js'

// ============================================================================
// Payload Renderer (SPEC-045d Phase 2)
// ============================================================================

export {
  // Interfaces
  type MessageContentRenderer,
  type RenderedContent,
  type RenderedAttachment,
  type InteractiveElement,
  // Generic Renderer
  GenericChannelPayloadRenderer,
  // Payload Extraction Helpers
  extractText,
  extractAttachments,
  extractInteractive,
  extractMedia,
  // Registry Functions
  registerRenderer,
  getRenderer,
  getAllRenderers,
  getGenericRenderer,
  // Render Function
  renderChannelPayload,
} from './lib/renderer.js'

// Inbound Normalizer Service
export {
  type InboundNormalizerService,
  inboundNormalizerService,
  createInboundNormalizerService,
  normalizeInboundMessage,
  detectInboundContentType,
  extractInboundMetadata,
} from './services/inbound-normalizer.service.js'

// Outbound Converter Service
export {
  type OutboundConverterService,
  outboundConverterService,
  createOutboundConverterService,
  convertOutboundMessage,
  prepareOutboundMetadata,
  convertOutboundMessages,
} from './services/outbound-converter.service.js'

// Contact Resolution Service
export {
  type ContactResolutionService,
  type TenantScope,
  type ContactResolutionResult,
  type ResolutionConfidence,
  type MatchedBy,
  type ChannelThreadMappingWithContact,
  getContactResolutionService,
  resetContactResolutionService,
  createContactResolutionService,
  resolveContact,
  enrichConversation,
} from './services/contact-resolution.service.js'

// ============================================================================
// Channel Message Type Registry (SPEC-T-926-11)
// ============================================================================

export {
  CHANNEL_MESSAGE_TYPES,
  CHANNEL_MESSAGE_ACTIONS,
  type ChannelMessageTypeDefinition,
  // Registry Functions
  registerChannelMessageTypes,
  getChannelMessageType,
  isChannelMessageType,
  getChannelMessageCapabilities,
  getAllChannelMessageTypes,
  getChannelMessageRenderer,
  // Integration
  initializeChannelMessageTypes,
  getChannelMessageActions,
  // Utilities
  getChannelTypesByCapability,
  getChannelTypesByRenderer,
  clearChannelMessageTypes,
} from './lib/message-type-registry.js'

// ============================================================================
// API Routes - Reactions
// ============================================================================

export {
  metadata as reactionsApiMetadata,
  GET as getReactions,
  POST as addReaction,
  DELETE as removeReaction,
  openApi as reactionsApiOpenApi,
} from './api/reactions/route.js'

// ============================================================================
// Reaction Bar Widget (SPEC-T-926-15)
// ============================================================================

// Widget Component
export { ReactionBarWidget, default as reactionBarInjection } from './widgets/reaction-bar/reaction-bar.inject.js'

// Enricher
export {
  enrichMessagesWithReactions,
  hasReactions,
  getReactionUserIds,
  type GroupedReaction as ReactionBarGroupedReaction,
  type ReactionEnricherInput,
  type ReactionEnricherOutput,
} from './widgets/reaction-bar/reaction-bar.enricher.js'

// ============================================================================
// Channel Badge Widget (SPEC-T-926-16)
// ============================================================================

// Widget Component
export { ChannelBadgeWidget, default as channelBadgeInjection, CHANNEL_COLORS, CHANNEL_ICONS, CHANNEL_BADGE_SIZES } from './widgets/channel-badge/channel-badge.inject.js'

// Enricher
export {
  enrichMessagesWithChannel,
  getChannelInfo,
  hasChannelInfo,
  type ChannelInfo as ChannelBadgeInfo,
  type ChannelEnricherInput,
  type ChannelEnricherOutput,
} from './widgets/channel-badge/channel-badge.enricher.js'

// ============================================================================
// Composer Capabilities Widget (SPEC-T-926-17)
// ============================================================================

// Widget Component
export {
  ComposerCapabilitiesWidget,
  default as composerCapabilitiesInjection,
  CAPABILITY_ICONS,
  CAPABILITY_LABELS,
  getEnabledCapabilities,
  type ComposerCapabilitiesContext,
  type ComposerCapabilitiesData,
  type ComposerCapabilitiesProps,
} from './widgets/composer-capabilities/index.js'

// ============================================================================
// Channel Info Panel Widget (SPEC-T-926-18)
// ============================================================================

// Widget Component
export {
  ChannelInfoPanelWidget,
  default as channelInfoPanelInjection,
  type ChannelInfoPanelContext,
  type ChannelInfoPanelData,
} from './widgets/channel-info-panel/index.js'

// ============================================================================
// Delivery Status Widget (SPEC-T-926-19)
// ============================================================================

// Widget Component
export {
  DeliveryStatusWidget,
  default as deliveryStatusInjection,
  STATUS_COLORS,
  STATUS_ICONS,
  type DeliveryStatusContext,
  type DeliveryStatusData,
} from './widgets/delivery-status/index.js'

// Enricher
export {
  enrichMessagesWithDeliveryStatus,
  getDeliveryStatus,
  hasDeliveryStatus,
  type DeliveryStatusInfo,
  type DeliveryStatusEnricherInput,
  type DeliveryStatusEnricherOutput,
} from './widgets/delivery-status/index.js'

