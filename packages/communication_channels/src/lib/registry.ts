/**
 * ChannelAdapter Registry v2
 * Based on SPEC-045d v2
 * Maintains backward compatibility with v1
 */

import type { ChannelCapabilities } from './capabilities.js'
import type { ChannelAdapterV2, ChannelAdapterV1 } from './adapter.js'
import { DEFAULT_CAPABILITIES } from './capabilities.js'

// ============================================================================
// Registry State
// ============================================================================

const CHANNEL_ADAPTERS_KEY = '__openMercatoChannelAdapters__'

interface RegistryState {
  v1Adapters: Map<string, ChannelAdapterV1>
  v2Adapters: Map<string, ChannelAdapterV2>
  capabilitiesCache: Map<string, ChannelCapabilities>
}

function getRegistry(): RegistryState {
  const globalState = globalThis as typeof globalThis & {
    [CHANNEL_ADAPTERS_KEY]?: RegistryState
  }

  if (!globalState[CHANNEL_ADAPTERS_KEY]) {
    globalState[CHANNEL_ADAPTERS_KEY] = {
      v1Adapters: new Map(),
      v2Adapters: new Map(),
      capabilitiesCache: new Map(),
    }
  }

  return globalState[CHANNEL_ADAPTERS_KEY]
}

// ============================================================================
// Registration Functions (v1 - backward compatible)
// ============================================================================

/**
 * Register a v1 adapter (backward compatible)
 * @deprecated Use registerAdapterV2 instead
 */
export function registerChannelAdapter(adapter: ChannelAdapterV1): () => void {
  const registry = getRegistry()
  registry.v1Adapters.set(adapter.providerKey, adapter)
  // v1 adapters get default capabilities
  registry.capabilitiesCache.set(adapter.providerKey, DEFAULT_CAPABILITIES)
  return () => {
    registry.v1Adapters.delete(adapter.providerKey)
    registry.capabilitiesCache.delete(adapter.providerKey)
  }
}

/**
 * Get a v1 adapter by provider key (backward compatible)
 * @deprecated Use getAdapter instead
 */
export function getChannelAdapter(providerKey: string): ChannelAdapterV1 | undefined {
  return getRegistry().v1Adapters.get(providerKey)
}

// ============================================================================
// Registration Functions (v2)
// ============================================================================

/**
 * Register a v2 adapter with full capabilities support
 */
export function registerAdapter(adapter: ChannelAdapterV2): () => void {
  const registry = getRegistry()
  registry.v2Adapters.set(adapter.providerKey, adapter)
  registry.capabilitiesCache.set(adapter.providerKey, adapter.capabilities)
  return () => {
    registry.v2Adapters.delete(adapter.providerKey)
    registry.capabilitiesCache.delete(adapter.providerKey)
  }
}

/**
 * Get an adapter (v2 takes priority over v1)
 */
export function getAdapter(providerKey: string): ChannelAdapterV2 | undefined {
  const registry = getRegistry()
  // Prefer v2 adapter
  const v2Adapter = registry.v2Adapters.get(providerKey)
  if (v2Adapter) return v2Adapter

  // Fall back to v1 adapter and wrap it with default capabilities
  const v1Adapter = registry.v1Adapters.get(providerKey)
  if (v1Adapter) {
    return wrapV1Adapter(v1Adapter)
  }

  return undefined
}

/**
 * Get capabilities for a specific provider
 */
export function getCapabilities(providerKey: string): ChannelCapabilities | undefined {
  return getRegistry().capabilitiesCache.get(providerKey)
}

/**
 * Resolve capabilities with default fallback
 */
export function resolveCapabilities(providerKey: string): ChannelCapabilities {
  return getCapabilities(providerKey) ?? DEFAULT_CAPABILITIES
}

// ============================================================================
// Listing Functions
// ============================================================================

/**
 * List all registered v1 adapters
 * @deprecated Use listAdapters instead
 */
export function listChannelAdapters(): ChannelAdapterV1[] {
  return Array.from(getRegistry().v1Adapters.values())
}

/**
 * List all registered adapters (v2 and v1 wrapped)
 */
export function listAdapters(): ChannelAdapterV2[] {
  const registry = getRegistry()
  const adapters: ChannelAdapterV2[] = []

  // Add all v2 adapters
  for (const adapter of registry.v2Adapters.values()) {
    adapters.push(adapter)
  }

  // Add v1 adapters wrapped as v2
  for (const adapter of registry.v1Adapters.values()) {
    adapters.push(wrapV1Adapter(adapter))
  }

  return adapters
}

/**
 * List all provider keys
 */
export function listProviderKeys(): string[] {
  const registry = getRegistry()
  const keys = new Set<string>()

  for (const key of registry.v1Adapters.keys()) {
    keys.add(key)
  }
  for (const key of registry.v2Adapters.keys()) {
    keys.add(key)
  }

  return Array.from(keys)
}

// ============================================================================
// Management Functions
// ============================================================================

/**
 * Clear all registered adapters
 */
export function clearAdapters(): void {
  const registry = getRegistry()
  registry.v1Adapters.clear()
  registry.v2Adapters.clear()
  registry.capabilitiesCache.clear()
}

/**
 * Check if an adapter is registered
 */
export function hasAdapter(providerKey: string): boolean {
  const registry = getRegistry()
  return registry.v1Adapters.has(providerKey) || registry.v2Adapters.has(providerKey)
}

/**
 * Get adapter count
 */
export function getAdapterCount(): number {
  const registry = getRegistry()
  return registry.v1Adapters.size + registry.v2Adapters.size
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wrap a v1 adapter to v2 interface
 * This provides backward compatibility
 */
function wrapV1Adapter(v1Adapter: ChannelAdapterV1): ChannelAdapterV2 {
  return {
    providerKey: v1Adapter.providerKey,
    channelType: v1Adapter.channelType,
    capabilities: DEFAULT_CAPABILITIES,
    sendMessage: v1Adapter.sendMessage,
    processInbound: v1Adapter.processInbound,
    verifyWebhook: v1Adapter.verifyWebhook,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Find adapters that support a specific capability
 */
export function findAdaptersByCapability(
  capability: keyof ChannelCapabilities,
  value: boolean = true
): ChannelAdapterV2[] {
  return listAdapters().filter((adapter) => {
    const capabilities = adapter.capabilities
    return capabilities[capability] === value
  })
}

/**
 * Find adapters that support reactions
 */
export function findAdaptersWithReactions(): ChannelAdapterV2[] {
  return findAdaptersByCapability('reactions', true)
}

/**
 * Find adapters that support message editing
 */
export function findAdaptersWithMessageEdit(): ChannelAdapterV2[] {
  return findAdaptersByCapability('editMessage', true)
}

/**
 * Find adapters that support file sharing
 */
export function findAdaptersWithFileSharing(): ChannelAdapterV2[] {
  return findAdaptersByCapability('fileSharing', true)
}

/**
 * Find adapters that support a specific body format
 */
export function findAdaptersByBodyFormat(
  format: 'text' | 'markdown' | 'html'
): ChannelAdapterV2[] {
  return listAdapters().filter((adapter) =>
    adapter.capabilities.supportedBodyFormats.includes(format)
  )
}
