/**
 * @open-mercato/channel-whatsapp - WhatsApp Business API v2 Adapter
 * Based on SPEC-045d Phase 7
 */

// Re-export types
export type {
  WhatsAppAdapterConfig,
  WhatsAppInboundMessage,
  WhatsAppOutboundMessage,
  WhatsAppInteractiveMessage,
  WhatsAppInteractiveButtons,
  WhatsAppInteractiveList,
  WhatsAppContact,
  WhatsAppLocation,
  WhatsAppReaction,
} from './types.js'

// Re-export capabilities
export { WHATSAPP_V2_CAPABILITIES } from './capabilities.js'

// Re-export converters
export {
  convertButtonsToWhatsApp,
  convertListToWhatsApp,
  parseInteractiveMessage,
  parseButtonReply,
  parseListReply,
} from './converters/interactive.js'

// Main exports
export { WhatsAppAdapter } from './WhatsAppAdapter.js'
export { WhatsAppClient } from './WhatsAppClient.js'
