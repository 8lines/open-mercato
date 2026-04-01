/**
 * WhatsApp Interactive Message Converters
 * Handles Buttons, Lists, and other interactive components
 * Based on SPEC-045d Phase 7
 */

import type {
  WhatsAppInteractiveButtons,
  WhatsAppInteractiveList,
  WhatsAppInteractiveMessage,
} from './types.js'

// ============================================================================
// Outbound Converters (Platform → WhatsApp)
// ============================================================================

export interface PlatformButton {
  id: string
  title: string
}

export interface PlatformListSection {
  title: string
  rows: Array<{
    id: string
    title: string
    description?: string
  }>
}

/**
 * Convert platform buttons to WhatsApp interactive buttons
 */
export function convertButtonsToWhatsApp(
  body: string,
  buttons: PlatformButton[],
  options?: {
    header?: string
    footer?: string
  }
): WhatsAppInteractiveMessage {
  return {
    type: 'button',
    header: options?.header,
    body: body,
    footer: options?.footer,
    buttons: buttons.map((btn) => ({
      id: btn.id,
      title: btn.title.substring(0, 20), // WhatsApp max 20 chars
    })),
  }
}

/**
 * Convert platform list to WhatsApp interactive list
 */
export function convertListToWhatsApp(
  body: string,
  buttonText: string,
  sections: PlatformListSection[],
  options?: {
    header?: string
    footer?: string
  }
): WhatsAppInteractiveMessage {
  return {
    type: 'list',
    header: options?.header,
    body: body,
    footer: options?.footer,
    button: buttonText.substring(0, 20), // WhatsApp max 20 chars
    sections: sections.map((section) => ({
      title: section.title.substring(0, 30), // WhatsApp max 30 chars
      rows: section.rows.slice(0, 10).map((row) => ({
        id: row.id,
        title: row.title.substring(0, 24), // WhatsApp max 24 chars
        description: row.description?.substring(0, 72), // WhatsApp max 72 chars
      })),
    })),
  }
}

// ============================================================================
// Inbound Converters (WhatsApp → Platform)
// ============================================================================

export interface ParsedInteractiveButton {
  id: string
  title: string
  type: 'button_reply'
}

export interface ParsedInteractiveList {
  id: string
  title: string
  description?: string
  type: 'list_reply'
}

/**
 * Parse inbound interactive button reply
 */
export function parseButtonReply(
  interactive: WhatsAppInteractiveMessage & { type: 'button' }
): ParsedInteractiveButton | null {
  const buttonReply = (interactive as any).button_reply
  if (!buttonReply) return null

  return {
    id: buttonReply.id,
    title: buttonReply.title,
    type: 'button_reply',
  }
}

/**
 * Parse inbound interactive list reply
 */
export function parseListReply(
  interactive: WhatsAppInteractiveMessage & { type: 'list' }
): ParsedInteractiveList | null {
  const listReply = (interactive as any).list_reply
  if (!listReply) return null

  return {
    id: listReply.id,
    title: listReply.title,
    description: listReply.description,
    type: 'list_reply',
  }
}

/**
 * Detect and parse any interactive message
 */
export function parseInteractiveMessage(
  raw: unknown
): { type: 'button' | 'list'; data: ParsedInteractiveButton | ParsedInteractiveList } | null {
  if (!raw || typeof raw !== 'object') return null

  const interactive = raw as { type?: string; button_reply?: unknown; list_reply?: unknown }

  if (interactive.type === 'button_reply') {
    const data = parseButtonReply(interactive as any)
    return data ? { type: 'button', data } : null
  }

  if (interactive.type === 'list_reply') {
    const data = parseListReply(interactive as any)
    return data ? { type: 'list', data } : null
  }

  return null
}
