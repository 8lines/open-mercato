/**
 * Channel Message Type Registry
 * 
 * Registers communication channel message types in the Messages module type registry.
 * This enables the Messages module to recognize and handle messages from various channels
 * (Slack, WhatsApp, Telegram, Email, SMS, etc.) with appropriate renderers and capabilities.
 */

import type { MessageTypeDefinition } from '@open-mercato/shared/modules/messages/types'

// =============================================================================
// Channel Message Types Definition
// =============================================================================

/**
 * Channel message types with their renderers and capabilities.
 * These types are registered in the Messages module's type registry.
 */
export const CHANNEL_MESSAGE_TYPES = {
  'channel.slack': {
    type: 'channel.slack',
    module: 'communication_channels',
    labelKey: 'channels.types.slack',
    icon: 'slack',
    renderer: 'slack-blocks',
    capabilities: ['richBlocks', 'reactions'],
  },
  'channel.slack DM': {
    type: 'channel.slack DM',
    module: 'communication_channels',
    labelKey: 'channels.types.slackDm',
    icon: 'slack',
    renderer: 'slack-blocks',
    capabilities: ['richBlocks'],
  },
  'channel.whatsapp': {
    type: 'channel.whatsapp',
    module: 'communication_channels',
    labelKey: 'channels.types.whatsapp',
    icon: 'whatsapp',
    renderer: 'whatsapp-interactive',
    capabilities: ['interactiveComponents'],
  },
  'channel.whatsapp.text': {
    type: 'channel.whatsapp.text',
    module: 'communication_channels',
    labelKey: 'channels.types.whatsappText',
    icon: 'whatsapp',
    renderer: 'text',
    capabilities: [],
  },
  'channel.telegram': {
    type: 'channel.telegram',
    module: 'communication_channels',
    labelKey: 'channels.types.telegram',
    icon: 'telegram',
    renderer: 'telegram-media',
    capabilities: ['fileSharing', 'inlineImages'],
  },
  'channel.email': {
    type: 'channel.email',
    module: 'communication_channels',
    labelKey: 'channels.types.email',
    icon: 'mail',
    renderer: 'email-html',
    capabilities: ['richText', 'attachments'],
  },
  'channel.email.plain': {
    type: 'channel.email.plain',
    module: 'communication_channels',
    labelKey: 'channels.types.emailPlain',
    icon: 'mail',
    renderer: 'text',
    capabilities: [],
  },
  'channel.sms': {
    type: 'channel.sms',
    module: 'communication_channels',
    labelKey: 'channels.types.sms',
    icon: 'message-square',
    renderer: 'text',
    capabilities: [],
  },
  'channel.webhook': {
    type: 'channel.webhook',
    module: 'communication_channels',
    labelKey: 'channels.types.webhook',
    icon: 'webhook',
    renderer: 'json',
    capabilities: [],
  },
  'channel.msteams': {
    type: 'channel.msteams',
    module: 'communication_channels',
    labelKey: 'channels.types.msteams',
    icon: 'microsoft-teams',
    renderer: 'teams-cards',
    capabilities: ['richBlocks'],
  },
} as const

// =============================================================================
// Message Action Mappings
// =============================================================================

/**
 * Mapping of interactive channel elements to MessageAction types.
 * This enables the Messages module to understand what actions are available
 * from each channel's interactive elements.
 */
export const CHANNEL_MESSAGE_ACTIONS = {
  'channel.whatsapp.button': ['open-url', 'reply', 'catalog'] as const,
  'channel.whatsapp.list': ['select-option'] as const,
  'channel.whatsapp.reply-button': ['reply'] as const,
  'channel.slack.button': ['open-url', 'submit'] as const,
  'channel.slack.select': ['select-option'] as const,
  'channel.slack.datepicker': ['select-date'] as const,
  'channel.telegram.inline-keyboard': ['open-url', 'callback'] as const,
} as const

// =============================================================================
// Type Definitions (extending MessageTypeDefinition for channels)
// =============================================================================

export interface ChannelMessageTypeDefinition extends MessageTypeDefinition {
  /** Custom renderer for this channel type */
  renderer: string
  /** Capabilities specific to this channel */
  capabilities: string[]
}

// =============================================================================
// Registry Functions
// =============================================================================

const registeredChannelTypes = new Map<string, ChannelMessageTypeDefinition>()

/**
 * Register all channel message types in the internal registry.
 * This is called during module initialization.
 */
export function registerChannelMessageTypes(): void {
  for (const [type, definition] of Object.entries(CHANNEL_MESSAGE_TYPES)) {
    if (registeredChannelTypes.has(type)) {
      console.warn(
        `[communication_channels] Channel message type "${type}" is already registered, overwriting`,
      )
    }
    // Cast to ChannelMessageTypeDefinition since we're extending the type
    registeredChannelTypes.set(type, definition as unknown as ChannelMessageTypeDefinition)
  }
  console.log(
    `[communication_channels] Registered ${Object.keys(CHANNEL_MESSAGE_TYPES).length} channel message types`,
  )
}

/**
 * Get a channel message type definition by type.
 * @param type - The message type string (e.g., 'channel.slack')
 * @returns The channel type definition or undefined if not found
 */
export function getChannelMessageType(
  type: string,
): ChannelMessageTypeDefinition | undefined {
  return registeredChannelTypes.get(type)
}

/**
 * Check if a message type string is a channel type.
 * @param type - The message type to check
 * @returns True if the type starts with 'channel.'
 */
export function isChannelMessageType(type: string): boolean {
  return type.startsWith('channel.')
}

/**
 * Get capabilities for a channel message type.
 * @param type - The message type (e.g., 'channel.slack')
 * @returns Array of capability strings or null if not a channel type
 */
export function getChannelMessageCapabilities(type: string): string[] | null {
  const channelType = registeredChannelTypes.get(type)
  return channelType?.capabilities ?? null
}

/**
 * Get all registered channel message types.
 * @returns Array of all channel message type definitions
 */
export function getAllChannelMessageTypes(): ChannelMessageTypeDefinition[] {
  return Array.from(registeredChannelTypes.values())
}

/**
 * Get the renderer for a channel message type.
 * @param type - The message type
 * @returns The renderer string or undefined if not found
 */
export function getChannelMessageRenderer(type: string): string | undefined {
  return registeredChannelTypes.get(type)?.renderer
}

// =============================================================================
// Integration with Messages Module
// =============================================================================

/**
 * Initialize channel message types in the Messages module type registry.
 * This function bridges the communication_channels module to the Messages module
 * by registering channel types and making them available for message handling.
 * 
 * @returns Promise that resolves when initialization is complete
 */
export async function initializeChannelMessageTypes(): Promise<void> {
  // Register our channel types in our internal registry
  registerChannelMessageTypes()

  // Try to register in Messages module if it's available
  try {
    // Dynamic import to avoid circular dependencies
    const { registerMessageTypes, getMessageType } = await import(
      '@open-mercato/core/modules/messages/lib/message-types-registry'
    )
    
    // Convert channel types to MessageTypeDefinition format for the Messages module
    const messageTypeDefinitions: MessageTypeDefinition[] = Array.from(
      registeredChannelTypes.values(),
    ).map((channelType) => ({
      type: channelType.type,
      module: channelType.module,
      labelKey: channelType.labelKey,
      icon: channelType.icon,
      color: channelType.color,
    }))

    // Register in Messages module
    registerMessageTypes(messageTypeDefinitions)
    console.log(
      `[communication_channels] Initialized ${messageTypeDefinitions.length} channel message types in Messages module`,
    )
  } catch (error) {
    // If Messages module is not available, just use internal registry
    console.warn(
      `[communication_channels] Messages module not available, using internal registry only`,
    )
  }
}

/**
 * Get available MessageAction types for a channel interactive element.
 * @param elementType - The interactive element type (e.g., 'channel.whatsapp.button')
 * @returns Array of action type strings or undefined
 */
export function getChannelMessageActions(
  elementType: string,
): readonly string[] | undefined {
  return CHANNEL_MESSAGE_ACTIONS[elementType as keyof typeof CHANNEL_MESSAGE_ACTIONS]
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get all channel types for a specific capability.
 * @param capability - The capability to filter by (e.g., 'richBlocks')
 * @returns Array of channel types that have the capability
 */
export function getChannelTypesByCapability(
  capability: string,
): ChannelMessageTypeDefinition[] {
  return Array.from(registeredChannelTypes.values()).filter((type) =>
    type.capabilities.includes(capability),
  )
}

/**
 * Get all channel types that support a specific renderer.
 * @param renderer - The renderer to filter by (e.g., 'slack-blocks')
 * @returns Array of channel types using the renderer
 */
export function getChannelTypesByRenderer(
  renderer: string,
): ChannelMessageTypeDefinition[] {
  return Array.from(registeredChannelTypes.values()).filter(
    (type) => type.renderer === renderer,
  )
}

/**
 * Clear all registered channel types (mainly for testing).
 */
export function clearChannelMessageTypes(): void {
  registeredChannelTypes.clear()
}