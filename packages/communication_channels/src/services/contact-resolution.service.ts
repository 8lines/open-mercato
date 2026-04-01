/**
 * Contact Resolution Service
 * Based on SPEC-045d v2
 * Resolves external channel identifiers to CRM contacts
 */

import { getAdapter, type ChannelAdapterV2 } from '../lib/adapter.js'
import type { ResolveContactInput, ContactHint } from '../lib/types.js'
import { ChannelThreadMapping } from '../data/entities.js'

// ============================================================================
// ORM Type (deferred import to avoid decorator issues)
// ============================================================================

/**
 * Loose type for ORM entity manager
 * Actual implementation would use proper Mikro-orm types
 */
export interface EntityManagerLike {
  findOne<T>(entity: new () => T, where: Record<string, unknown>): Promise<T | null>
  flush(): Promise<void>
}

// ============================================================================
// Tenant Scope
// ============================================================================

/**
 * Tenant scope for multi-tenant operations
 */
export interface TenantScope {
  tenantId?: string | null
  organizationId?: string | null
}

// ============================================================================
// Resolution Types
// ============================================================================

/**
 * Resolution confidence level
 */
export type ResolutionConfidence = 'high' | 'medium' | 'low' | 'none'

/**
 * How the contact was matched
 */
export type MatchedBy = 'email' | 'phone' | 'name' | 'adapter' | 'none'

/**
 * Result of contact resolution
 */
export interface ContactResolutionResult {
  contactPersonId: string | null
  confidence: ResolutionConfidence
  matchedBy: MatchedBy
  displayName?: string
  avatarUrl?: string
  email?: string
  phone?: string
}

/**
 * Channel thread mapping with linked contact
 */
export interface ChannelThreadMappingWithContact extends ChannelThreadMapping {
  _linkedContact?: {
    id: string
    name: string
    email?: string
    phone?: string
  } | null
}

// ============================================================================
// Resolution Strategies (priority order)
// ============================================================================

const RESOLUTION_STRATEGIES = ['email', 'phone', 'name', 'adapter'] as const

type ResolutionStrategy = (typeof RESOLUTION_STRATEGIES)[number]

// ============================================================================
// Service Interface
// ============================================================================

export interface ContactResolutionService {
  /**
   * Resolve an external identifier to a CRM contact
   */
  resolve(
    providerKey: string,
    senderIdentifier: string,
    scope: TenantScope
  ): Promise<ContactResolutionResult>

  /**
   * Enrich a conversation with linked contact info
   */
  enrichConversation(
    externalConversationId: string,
    channelId: string
  ): Promise<ChannelThreadMappingWithContact | null>
}

// ============================================================================
// Default Implementation
// ============================================================================

class DefaultContactResolutionService implements ContactResolutionService {
  private orm: EntityManagerLike | null = null

  constructor(orm?: EntityManagerLike | null) {
    this.orm = orm ?? null
  }

  /**
   * Resolve an external identifier to a CRM contact
   * Tries strategies in priority order: email → phone → name → adapter
   */
  async resolve(
    providerKey: string,
    senderIdentifier: string,
    scope: TenantScope
  ): Promise<ContactResolutionResult> {
    // Try each strategy in order until we get a match
    for (const strategy of RESOLUTION_STRATEGIES) {
      const result = await this.tryStrategy(providerKey, senderIdentifier, strategy, scope)
      if (result && result.contactPersonId) {
        return result
      }
    }

    // No match found
    return {
      contactPersonId: null,
      confidence: 'none',
      matchedBy: 'none',
    }
  }

  /**
   * Try a specific resolution strategy
   */
  private async tryStrategy(
    providerKey: string,
    senderIdentifier: string,
    strategy: ResolutionStrategy,
    scope: TenantScope
  ): Promise<ContactResolutionResult | null> {
    switch (strategy) {
      case 'email':
        return this.resolveByEmail(senderIdentifier, scope)
      case 'phone':
        return this.resolveByPhone(senderIdentifier, scope)
      case 'name':
        return this.resolveByName(senderIdentifier, scope)
      case 'adapter':
        return this.resolveByAdapter(providerKey, senderIdentifier)
      default:
        return null
    }
  }

  /**
   * Resolve by email address
   */
  private async resolveByEmail(
    senderIdentifier: string,
    scope: TenantScope
  ): Promise<ContactResolutionResult | null> {
    // Check if senderIdentifier looks like an email
    if (!senderIdentifier.includes('@')) {
      return null
    }

    // TODO: Integrate with CRM to find person by email
    // This is a placeholder - would use CRM service
    // const person = await crm.findPersonByEmail(senderIdentifier, scope)
    // if (person) { ... }

    return null
  }

  /**
   * Resolve by phone number
   */
  private async resolveByPhone(
    senderIdentifier: string,
    scope: TenantScope
  ): Promise<ContactResolutionResult | null> {
    // Check if senderIdentifier looks like a phone number
    const phonePattern = /^[+]?[\d\s()-]{7,20}$/
    if (!phonePattern.test(senderIdentifier)) {
      return null
    }

    // TODO: Integrate with CRM to find person by phone
    // const person = await crm.findPersonByPhone(senderIdentifier, scope)
    // if (person) { ... }

    return null
  }

  /**
   * Resolve by name (with optional domain)
   */
  private async resolveByName(
    senderIdentifier: string,
    scope: TenantScope
  ): Promise<ContactResolutionResult | null> {
    // Name resolution is uncertain - requires additional context
    // Extract domain from email-like identifiers if present
    const emailMatch = senderIdentifier.match(/^(.+)@(.+)$/)
    if (emailMatch) {
      const name = emailMatch[1]
      const domain = emailMatch[2]

      // TODO: Integrate with CRM to find person by name + domain
      // const person = await crm.findPersonByName(name, domain, scope)
      // if (person) { ... }
    }

    return null
  }

  /**
   * Resolve using adapter's resolveContact method
   */
  private async resolveByAdapter(
    providerKey: string,
    senderIdentifier: string
  ): Promise<ContactResolutionResult | null> {
    const adapter = getAdapter(providerKey)

    if (!adapter || !this.supportsResolveContact(adapter)) {
      return null
    }

    try {
      const input: ResolveContactInput = {
        identifier: senderIdentifier,
        channelId: providerKey, // Use provider key as channel ID for now
      }

      const contactHint = await adapter.resolveContact!(input)

      if (!contactHint) {
        return null
      }

      // Convert adapter hint to our result format
      return {
        contactPersonId: contactHint.id,
        confidence: 'medium', // Adapter resolution is less certain than CRM
        matchedBy: 'adapter',
        displayName: contactHint.name,
        avatarUrl: contactHint.avatarUrl,
        email: contactHint.email,
        phone: contactHint.phone,
      }
    } catch {
      return null
    }
  }

  /**
   * Check if adapter supports resolveContact
   */
  private supportsResolveContact(adapter: ChannelAdapterV2): boolean {
    return typeof adapter.resolveContact === 'function'
  }

  /**
   * Enrich a conversation with linked contact info
   */
  async enrichConversation(
    externalConversationId: string,
    channelId: string
  ): Promise<ChannelThreadMappingWithContact | null> {
    if (!this.orm) {
      // No ORM - return basic mapping without enrichment
      console.warn('ContactResolutionService: No ORM configured, skipping enrichment')
      return null
    }

    try {
      const mapping = await this.orm.findOne(ChannelThreadMapping, {
        externalConversationId,
        channelId,
      })

      if (!mapping) {
        return null
      }

      // TODO: Load linked contact from CRM
      // This would query the CRM for the contactPersonId
      // const contact = await crm.getContact(mapping.contactPersonId)

      // Return with optional contact enrichment
      return {
        ...mapping,
        // _linkedContact: contact ? { id: contact.id, name: contact.name, email: contact.email, phone: contact.phone } : null,
      }
    } catch (error) {
      console.error('ContactResolutionService: Failed to enrich conversation', error)
      return null
    }
  }

  /**
   * Update channel thread mapping with contact ID
   */
  async updateMappingWithContact(
    externalConversationId: string,
    channelId: string,
    contactPersonId: string
  ): Promise<void> {
    if (!this.orm) {
      console.warn('ContactResolutionService: No ORM configured, skipping update')
      return
    }

    try {
      const mapping = await this.orm.findOne(ChannelThreadMapping, {
        externalConversationId,
        channelId,
      })

      if (!mapping) {
        console.warn('ContactResolutionService: Mapping not found', {
          externalConversationId,
          channelId,
        })
        return
      }

      // Update the mapping with contact ID
      // Note: Need to add contactPersonId field to ChannelThreadMapping entity
      // For now, we store it in channelPayload
      const payload = mapping.channelPayload || {}
      ;(mapping as any).channelPayload = {
        ...payload,
        linkedContactPersonId: contactPersonId,
      }

      await this.orm.flush()
    } catch (error) {
      console.error('ContactResolutionService: Failed to update mapping', error)
      throw error
    }
  }
}

// ============================================================================
// Export Singleton
// ============================================================================

let contactResolutionServiceInstance: ContactResolutionService | null = null

/**
 * Get the singleton ContactResolutionService instance
 * @param orm Optional ORM for database operations
 */
export function getContactResolutionService(
  orm?: EntityManagerLike | null
): ContactResolutionService {
  if (!contactResolutionServiceInstance) {
    contactResolutionServiceInstance = new DefaultContactResolutionService(orm ?? null)
  }
  return contactResolutionServiceInstance
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetContactResolutionService(): void {
  contactResolutionServiceInstance = null
}

// ============================================================================
// Export Factory (for custom implementations)
// ============================================================================

export function createContactResolutionService(
  orm?: EntityManagerLike | null,
  customService?: ContactResolutionService
): ContactResolutionService {
  return customService ?? new DefaultContactResolutionService(orm ?? null)
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick resolve without full service initialization
 */
export async function resolveContact(
  providerKey: string,
  senderIdentifier: string,
  scope: TenantScope
): Promise<ContactResolutionResult> {
  const service = getContactResolutionService()
  return service.resolve(providerKey, senderIdentifier, scope)
}

/**
 * Quick enrich conversation
 */
export async function enrichConversation(
  externalConversationId: string,
  channelId: string
): Promise<ChannelThreadMappingWithContact | null> {
  const service = getContactResolutionService()
  return service.enrichConversation(externalConversationId, channelId)
}

// ============================================================================
// CRM Integration Helpers (for future integration)
// ============================================================================

/**
 * Placeholder for CRM integration
 * These functions would be replaced with actual CRM service calls
 */

/*
// Example integration:
import { crmService } from '@open-mercato/crm'

async function findPersonByEmail(email: string, scope: TenantScope): Promise<Person | null> {
  return crmService.findPersonByEmail(email, scope)
}

async function findPersonByPhone(phone: string, scope: TenantScope): Promise<Person | null> {
  return crmService.findPersonByPhone(phone, scope)
}

async function findPersonByName(name: string, domain?: string, scope: TenantScope): Promise<Person | null> {
  return crmService.findPersonByName(name, domain, scope)
}
*/