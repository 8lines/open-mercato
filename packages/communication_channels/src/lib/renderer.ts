/**
 * Generic Channel Payload Renderer
 * Based on SPEC-045d Phase 2
 * Fallback renderer for when provider-specific renderer is not available
 */

import type { ChannelCapabilities } from './capabilities.js'

// ============================================================================
// Renderer Interfaces
// ============================================================================

export interface MessageContentRenderer {
  canRender(contentType: string): boolean
  render(payload: Record<string, unknown>): RenderedContent
  getSupportedTypes(): string[]
}

export interface RenderedContent {
  html?: string
  markdown?: string
  plainText?: string
  attachments?: RenderedAttachment[]
  interactive?: InteractiveElement[]
}

export interface RenderedAttachment {
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  name?: string
  size?: number
  thumbnail?: string
}

export interface InteractiveElement {
  type: 'button' | 'list' | 'carousel' | 'datePicker'
  label: string
  action: string
  value?: string
}

// ============================================================================
// Generic Channel Payload Renderer (Fallback)
// ============================================================================

export class GenericChannelPayloadRenderer implements MessageContentRenderer {
  canRender(contentType: string): boolean {
    // Wildcard - returns true for all unknown types as fallback
    return true
  }

  render(payload: Record<string, unknown>): RenderedContent {
    const text = extractText(payload)
    const attachments = extractAttachments(payload)
    const interactive = extractInteractive(payload)

    return {
      plainText: text ?? undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      interactive: interactive.length > 0 ? interactive : undefined,
    }
  }

  getSupportedTypes(): string[] {
    return ['*'] // Wildcard - catch-all
  }
}

// ============================================================================
// Payload Extraction Helpers
// ============================================================================

/**
 * Extracts text content from a payload
 * Handles common payload structures from various providers
 */
export function extractText(payload: Record<string, unknown>): string | null {
  // Direct text field
  if (typeof payload.text === 'string') {
    return payload.text
  }

  // Message object with body
  if (typeof payload.message === 'object' && payload.message !== null) {
    const message = payload.message as Record<string, unknown>
    if (typeof message.text === 'string') {
      return message.text
    }
    if (typeof message.body === 'string') {
      return message.body
    }
  }

  // Body field
  if (typeof payload.body === 'string') {
    return payload.body
  }

  // Content field
  if (typeof payload.content === 'string') {
    return payload.content
  }

  // Caption field (common for media)
  if (typeof payload.caption === 'string') {
    return payload.caption
  }

  // Fallback: try first string value
  const stringValues = Object.values(payload).filter((v) => typeof v === 'string')
  if (stringValues.length > 0) {
    return stringValues[0] as string
  }

  return null
}

/**
 * Extracts attachments from a payload
 * Handles various payload structures from different providers
 */
export function extractAttachments(payload: Record<string, unknown>): RenderedAttachment[] {
  const attachments: RenderedAttachment[] = []

  // Direct attachments array
  if (Array.isArray(payload.attachments)) {
    for (const att of payload.attachments) {
      const rendered = renderAttachment(att)
      if (rendered) {
        attachments.push(rendered)
      }
    }
  }

  // Media array
  if (Array.isArray(payload.media)) {
    for (const att of payload.media) {
      const rendered = renderAttachment(att)
      if (rendered) {
        attachments.push(rendered)
      }
    }
  }

  // Files array
  if (Array.isArray(payload.files)) {
    for (const att of payload.files) {
      const rendered = renderAttachment(att)
      if (rendered) {
        attachments.push(rendered)
      }
    }
  }

  // Message object with attachments
  if (typeof payload.message === 'object' && payload.message !== null) {
    const message = payload.message as Record<string, unknown>
    if (Array.isArray(message.attachments)) {
      for (const att of message.attachments) {
        const rendered = renderAttachment(att)
        if (rendered) {
          attachments.push(rendered)
        }
      }
    }
    if (Array.isArray(message.media)) {
      for (const att of message.media) {
        const rendered = renderAttachment(att)
        if (rendered) {
          attachments.push(rendered)
        }
      }
    }
  }

  return attachments
}

/**
 * Renders a single attachment object to RenderedAttachment
 */
function renderAttachment(att: unknown): RenderedAttachment | null {
  if (typeof att !== 'object' || att === null) {
    return null
  }

  const a = att as Record<string, unknown>

  // Determine type
  let type: RenderedAttachment['type'] = 'document'

  const mimeType = typeof a.mimeType === 'string' ? a.mimeType : ''
  const url = typeof a.url === 'string' ? a.url : ''

  if (mimeType.startsWith('image/') || a.type === 'image') {
    type = 'image'
  } else if (mimeType.startsWith('video/') || a.type === 'video') {
    type = 'video'
  } else if (mimeType.startsWith('audio/') || a.type === 'audio') {
    type = 'audio'
  } else if (mimeType.startsWith('application/pdf') || a.type === 'document') {
    type = 'document'
  }

  if (!url) {
    return null
  }

  return {
    type,
    url,
    name: typeof a.name === 'string' ? a.name : undefined,
    size: typeof a.size === 'number' ? a.size : undefined,
    thumbnail: typeof a.thumbnail === 'string' ? a.thumbnail : undefined,
  }
}

/**
 * Extracts interactive elements from a payload
 * Handles buttons, lists, carousels, and other interactive elements
 */
export function extractInteractive(payload: Record<string, unknown>): InteractiveElement[] {
  const interactive: InteractiveElement[] = []

  // Direct interactive array
  if (Array.isArray(payload.interactive)) {
    for (const el of payload.interactive) {
      const rendered = renderInteractiveElement(el)
      if (rendered) {
        interactive.push(rendered)
      }
    }
  }

  // Buttons array
  if (Array.isArray(payload.buttons)) {
    for (const btn of payload.buttons) {
      const rendered = renderInteractiveElement({ type: 'button', ...(btn as object) })
      if (rendered) {
        interactive.push(rendered)
      }
    }
  }

  // Message object with interactive
  if (typeof payload.message === 'object' && payload.message !== null) {
    const message = payload.message as Record<string, unknown>
    if (Array.isArray(message.interactive)) {
      for (const el of message.interactive) {
        const rendered = renderInteractiveElement(el)
        if (rendered) {
          interactive.push(rendered)
        }
      }
    }
    if (Array.isArray(message.buttons)) {
      for (const btn of message.buttons) {
        const rendered = renderInteractiveElement({ type: 'button', ...(btn as object) })
        if (rendered) {
          interactive.push(rendered)
        }
      }
    }
  }

  // Action object with buttons
  if (typeof payload.action === 'object' && payload.action !== null) {
    const action = payload.action as Record<string, unknown>
    if (Array.isArray(action.buttons)) {
      for (const btn of action.buttons) {
        const rendered = renderInteractiveElement({ type: 'button', ...(btn as object) })
        if (rendered) {
          interactive.push(rendered)
        }
      }
    }
  }

  return interactive
}

/**
 * Renders a single interactive element
 */
function renderInteractiveElement(el: unknown): InteractiveElement | null {
  if (typeof el !== 'object' || el === null) {
    return null
  }

  const e = el as Record<string, unknown>

  const type = typeof e.type === 'string' ? e.type : 'button'
  const label = typeof e.label === 'string' ? e.title ?? e.label ?? '' : ''
  const action = typeof e.action === 'string' ? e.action ?? e.url ?? '' : ''
  const value = typeof e.value === 'string' ? e.value : undefined

  if (!label || !action) {
    return null
  }

  return {
    type: type as InteractiveElement['type'],
    label,
    action,
    value,
  }
}

/**
 * Extracts media from a payload (alias for extractAttachments with media focus)
 */
export function extractMedia(payload: Record<string, unknown>): RenderedAttachment[] {
  return extractAttachments(payload)
}

// ============================================================================
// Renderer Registry
// ============================================================================

class RendererRegistry {
  private renderers: Map<string, MessageContentRenderer> = new Map()
  private genericRenderer: GenericChannelPayloadRenderer = new GenericChannelPayloadRenderer()

  registerRenderer(contentType: string, renderer: MessageContentRenderer): void {
    this.renderers.set(contentType, renderer)
  }

  getRenderer(contentType: string): MessageContentRenderer | null {
    const renderer = this.renderers.get(contentType)
    if (renderer && renderer.canRender(contentType)) {
      return renderer
    }
    return null
  }

  getAllRenderers(): MessageContentRenderer[] {
    return Array.from(this.renderers.values())
  }

  getGenericRenderer(): GenericChannelPayloadRenderer {
    return this.genericRenderer
  }
}

// Singleton instance
const registry = new RendererRegistry()

// ============================================================================
// Public Registry Functions
// ============================================================================

export function registerRenderer(contentType: string, renderer: MessageContentRenderer): void {
  registry.registerRenderer(contentType, renderer)
}

export function getRenderer(contentType: string): MessageContentRenderer | null {
  return registry.getRenderer(contentType)
}

export function getAllRenderers(): MessageContentRenderer[] {
  return registry.getAllRenderers()
}

export function getGenericRenderer(): GenericChannelPayloadRenderer {
  return registry.getGenericRenderer()
}

// ============================================================================
// Render Function
// ============================================================================

/**
 * Renders a channel payload using the appropriate renderer
 * Falls back to generic renderer if provider-specific renderer is not available
 */
export function renderChannelPayload(
  contentType: string,
  payload: Record<string, unknown>
): RenderedContent {
  const renderer = getRenderer(contentType)

  if (renderer) {
    return renderer.render(payload)
  }

  // Fallback to generic renderer
  return registry.getGenericRenderer().render(payload)
}
