/**
 * Email Threading Enricher
 * Handles email thread detection and mapping
 * Based on SPEC-045d Phase 7
 */

import type { ThreadingConfig, ThreadMatchResult, EmailHeaders } from './types.js'
import { stripSubjectPrefixes } from './EmailParser.js'

const DEFAULT_CONFIG: ThreadingConfig = {
  mode: 'hybrid',
  subjectPrefixes: ['Re:', 'Fwd:', 'AW:', 'SV:', 'ODP:', 'FW:'],
  subjectMatchWindow: 60, // 60 minutes
}

/**
 * Email Threading Enricher
 * Matches emails to threads based on In-Reply-To, References, or Subject
 */
export class ThreadingEnricher {
  private config: ThreadingConfig

  constructor(config: Partial<ThreadingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Match an inbound email to an existing thread
   */
  matchThread(headers: EmailHeaders, currentThreads: Map<string, {
    subject: string
    from: string
    date: Date
  }>): ThreadMatchResult {
    const mode = this.config.mode

    if (mode === 'headers' || mode === 'hybrid') {
      // Try headers first
      const headerResult = this.matchByHeaders(headers)
      if (headerResult.threadId) {
        return headerResult
      }
    }

    if (mode === 'subject' || mode === 'hybrid') {
      // Fall back to subject matching
      const subjectResult = this.matchBySubject(headers, currentThreads)
      return subjectResult
    }

    return { threadId: null, isReply: false }
  }

  /**
   * Match by In-Reply-To and References headers
   */
  private matchByHeaders(headers: EmailHeaders): ThreadMatchResult {
    // Check In-Reply-To
    if (headers.inReplyTo) {
      return {
        threadId: headers.inReplyTo,
        isReply: true,
        parentMessageId: headers.inReplyTo,
      }
    }

    // Check References (take last ID)
    if (headers.references) {
      const refIds = headers.references.trim().split(/\s+/)
      const lastRef = refIds[refIds.length - 1]
      
      return {
        threadId: lastRef,
        isReply: true,
        parentMessageId: lastRef,
      }
    }

    return { threadId: null, isReply: false }
  }

  /**
   * Match by Subject line (similar subject = same thread)
   */
  private matchBySubject(
    headers: EmailHeaders,
    currentThreads: Map<string, { subject: string; from: string; date: Date }>
  ): ThreadMatchResult {
    const subject = headers.subject
    if (!subject) {
      return { threadId: null, isReply: false }
    }

    // Strip prefixes
    const cleanSubject = stripSubjectPrefixes(subject, this.config.subjectPrefixes)
    const from = headers.from?.address

    // Find matching thread
    for (const [threadId, thread] of currentThreads) {
      const cleanThreadSubject = stripSubjectPrefixes(
        thread.subject,
        this.config.subjectPrefixes
      )

      // Subject matches
      if (cleanSubject.toLowerCase() === cleanThreadSubject.toLowerCase()) {
        // Check sender match
        if (from && thread.from.toLowerCase() === from.toLowerCase()) {
          // Check time window
          if (this.config.subjectMatchWindow) {
            const timeDiff = Math.abs(
              (headers.date?.getTime() || Date.now()) - thread.date.getTime()
            )
            const windowMs = this.config.subjectMatchWindow * 60 * 1000
            
            if (timeDiff <= windowMs) {
              return {
                threadId,
                isReply: true,
              }
            }
          } else {
            return {
              threadId,
              isReply: true,
            }
          }
        }
      }
    }

    return { threadId: null, isReply: false }
  }

  /**
   * Generate new thread ID for email
   */
  generateThreadId(headers: EmailHeaders): string {
    // Use Message-ID as thread ID for new threads
    return headers.messageId || `thread-${Date.now()}-${Math.random().toString(36).substring(2)}`
  }

  /**
   * Build References header for outbound reply
   */
  buildReferences(parentMessageId: string, existingReferences?: string): string {
    return generateReferences(parentMessageId, existingReferences)
  }
}

/**
 * Generate References header
 */
function generateReferences(parentMessageId: string, existingReferences?: string): string {
  if (existingReferences) {
    return `${existingReferences} ${parentMessageId}`
  }
  return parentMessageId
}

/**
 * Default enricher instance
 */
export const defaultThreadingEnricher = new ThreadingEnricher()
