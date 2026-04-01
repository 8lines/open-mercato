/**
 * Email Parser
 * Parses raw email messages and extracts components
 */

import type {
  EmailHeaders,
  EmailAddress,
  EmailAttachment,
  EmailInboundMessage,
} from './types.js'

// ============================================================================
// Email Parsing
// ============================================================================

/**
 * Parse raw email into structured format
 */
export function parseEmail(raw: string): EmailInboundMessage {
  const headers = parseHeaders(raw)
  const { text, html, attachments } = parseBody(raw, headers)
  
  return {
    raw,
    headers,
    from: headers.from || { address: '' },
    to: headers.to || [],
    cc: headers.cc,
    subject: headers.subject || '',
    text,
    html,
    attachments,
    timestamp: headers.date || new Date(),
  }
}

/**
 * Parse email headers
 */
export function parseHeaders(raw: string): EmailHeaders {
  const headerEndIndex = raw.indexOf('\r\n\r\n') !== -1 
    ? raw.indexOf('\r\n\r\n') 
    : raw.indexOf('\n\n')
  
  const headerSection = headerEndIndex !== -1 
    ? raw.substring(0, headerEndIndex) 
    : raw
  
  const headers: EmailHeaders = {}
  const lines = headerSection.split(/\r?\n/)
  
  let currentHeader: string | null = null
  let currentValue = ''
  
  for (const line of lines) {
    // Continuation line
    if (/^\s/.test(line) && currentHeader) {
      currentValue += ' ' + line.trim()
      continue
    }
    
    // Save previous header
    if (currentHeader) {
      processHeader(headers, currentHeader, currentValue)
    }
    
    // Parse new header
    const match = line.match(/^([^:]+):\s*(.*)$/)
    if (match) {
      currentHeader = match[1]
      currentValue = match[2]
    }
  }
  
  // Process last header
  if (currentHeader) {
    processHeader(headers, currentHeader, currentValue)
  }
  
  return headers
}

function processHeader(headers: EmailHeaders, name: string, value: string): void {
  const lowerName = name.toLowerCase()
  
  switch (lowerName) {
    case 'message-id':
      headers.messageId = value.trim()
      break
    case 'in-reply-to':
      headers.inReplyTo = value.trim()
      break
    case 'references':
      headers.references = value.trim()
      break
    case 'subject':
      headers.subject = value.trim()
      break
    case 'from':
      headers.from = parseAddress(value.trim())
      break
    case 'to':
      headers.to = parseAddressList(value.trim())
      break
    case 'cc':
      headers.cc = parseAddressList(value.trim())
      break
    case 'bcc':
      headers.bcc = parseAddressList(value.trim())
      break
    case 'date':
      headers.date = new Date(value.trim())
      break
    case 'return-path':
      headers.returnPath = value.trim()
      break
  }
}

/**
 * Parse single address (e.g., "John Doe <john@example.com>")
 */
export function parseAddress(input: string): EmailAddress {
  const match = input.match(/^(.+?)\s*<(.+?)>$/) || input.match(/^(.+)$/)
  
  if (match) {
    return {
      name: match[1]?.trim(),
      address: match[2]?.trim() || match[1]?.trim() || input.trim(),
    }
  }
  
  return { address: input.trim() }
}

/**
 * Parse comma-separated address list
 */
export function parseAddressList(input: string): EmailAddress[] {
  // Split by comma, but handle quoted names
  const addresses = input.split(/,\s*/).map(parseAddress)
  return addresses
}

/**
 * Parse email body (text and html parts)
 */
function parseBody(raw: string, headers: EmailHeaders): {
  text?: string
  html?: string
  attachments: EmailAttachment[]
} {
  const headerEndIndex = raw.indexOf('\r\n\r\n') !== -1 
    ? raw.indexOf('\r\n\r\n') 
    : raw.indexOf('\n\n')
  
  if (headerEndIndex === -1) {
    return { attachments: [] }
  }
  
  const bodySection = raw.substring(headerEndIndex + (raw[headerEndIndex + 1] === '\r' ? 4 : 2))
  
  // Simple multipart detection (basic implementation)
  const contentType = headers['content-type']?.toLowerCase() || ''
  
  if (contentType.includes('multipart/')) {
    return parseMultipartBody(bodySection, contentType)
  }
  
  // Single part
  const encoding = headers['content-transfer-encoding']?.toLowerCase()
  
  if (contentType.includes('text/html')) {
    return {
      html: decodeBody(bodySection.trim(), encoding),
      attachments: [],
    }
  }
  
  return {
    text: decodeBody(bodySection.trim(), encoding),
    attachments: [],
  }
}

/**
 * Parse multipart body (simplified)
 */
function parseMultipartBody(body: string, contentType: string): {
  text?: string
  html?: string
  attachments: EmailAttachment[]
} {
  const result: {
    text?: string
    html?: string
    attachments: EmailAttachment[]
  } = { attachments: [] }
  
  // Extract boundary
  const boundaryMatch = contentType.match(/boundary="?([^";\s]+)"?/)
  const boundary = boundaryMatch?.[1]
  
  if (!boundary) {
    return result
  }
  
  // Split by boundary
  const parts = body.split(`--${boundary}`).filter(p => p.trim() && !p.startsWith('--'))
  
  for (const part of parts) {
    const partHeaders = parseHeaders(part)
    const partBodyStart = part.indexOf('\r\n\r\n') !== -1 
      ? part.indexOf('\r\n\r\n') + 4 
      : part.indexOf('\n\n') + 2
    
    if (partBodyStart === -1) continue
    
    const partBody = part.substring(partBodyStart)
    const partContentType = partHeaders['content-type']?.toLowerCase() || ''
    const encoding = partHeaders['content-transfer-encoding']?.toLowerCase()
    
    if (partContentType.includes('text/html')) {
      result.html = decodeBody(partBody.trim(), encoding)
    } else if (partContentType.includes('text/plain')) {
      result.text = decodeBody(partBody.trim(), encoding)
    } else {
      // Attachment
      const filename = partHeaders['content-disposition']?.match(/filename="?([^";\s]+)"?/)?.[1]
      if (filename) {
        result.attachments.push({
          filename,
          contentType: partContentType,
          size: partBody.length,
        })
      }
    }
  }
  
  return result
}

/**
 * Decode email body based on transfer encoding
 */
function decodeBody(body: string, encoding?: string): string {
  if (!encoding) return body
  
  if (encoding === 'base64') {
    try {
      return Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8')
    } catch {
      return body
    }
  }
  
  if (encoding === 'quoted-printable') {
    try {
      return body.replace(/=[\r\n]+/g, '').replace(/=([0-9A-F]{2})/gi, (_, hex) => 
        String.fromCharCode(parseInt(hex, 16))
      )
    } catch {
      return body
    }
  }
  
  return body
}

/**
 * Strip subject prefixes for threading (Re: Fwd:, etc.)
 */
export function stripSubjectPrefixes(subject: string, prefixes: string[] = ['Re:', 'Fwd:', 'AW:', 'SV:']): string {
  let stripped = subject
  
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${prefix}\\s*`, 'i')
    stripped = stripped.replace(regex, '')
  }
  
  return stripped.trim()
}

/**
 * Generate Message-ID for outbound email
 */
export function generateMessageId(domain: string): string {
  const unique = `${Date.now()}.${Math.random().toString(36).substring(2)}`
  return `<${unique}@${domain}>`
}

/**
 * Generate References header for threading
 */
export function generateReferences(parentMessageId?: string, existingReferences?: string): string {
  if (existingReferences) {
    return parentMessageId ? `${existingReferences} ${parentMessageId}` : existingReferences
  }
  return parentMessageId || ''
}
