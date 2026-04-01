/**
 * @open-mercato/channel-email - Email Channel Adapter
 * Based on SPEC-045d Phase 7
 */

// Re-export types
export type {
  EmailAdapterConfig,
  EmailInboundMessage,
  EmailOutboundMessage,
  EmailAddress,
  EmailAttachment,
  EmailHeaders,
  ThreadingConfig,
  ThreadMatchResult,
} from './types.js'

// Re-export capabilities
export { EMAIL_V2_CAPABILITIES } from './capabilities.js'

// Re-export enrichers
export { ThreadingEnricher, defaultThreadingEnricher } from './enrichers/threading.enricher.js'

// Re-export parser
export {
  parseEmail,
  parseAddress,
  parseAddressList,
  stripSubjectPrefixes,
  generateMessageId,
  generateReferences,
} from './EmailParser.js'

// Main exports
export { EmailAdapter } from './EmailAdapter.js'
