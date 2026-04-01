/**
 * Convert Slack Block Kit to markdown
 */

import type { SlackBlock } from './types.js'

/**
 * Convert Slack Block Kit elements to markdown
 */
export function convertBlocksToMarkdown(blocks: SlackBlock[]): string {
  if (!blocks || blocks.length === 0) {
    return ''
  }

  const parts: string[] = []

  for (const block of blocks) {
    switch (block.type) {
      case 'section':
        parts.push(convertSectionToMarkdown(block))
        break
      case 'divider':
        parts.push('---')
        break
      case 'header':
        parts.push(convertHeaderToMarkdown(block))
        break
      case 'rich_text':
        parts.push(convertRichTextToMarkdown(block))
        break
      case 'actions':
        // Actions blocks contain interactive elements, not text content
        break
      case 'context':
        parts.push(convertContextToMarkdown(block))
        break
      case 'image':
        parts.push(convertImageToMarkdown(block))
        break
      case 'input':
        // Input blocks are for forms, skip in conversion
        break
      default:
        // Handle unknown block types
        if (block.text?.text) {
          parts.push(block.text.text)
        }
    }
  }

  return parts.filter(Boolean).join('\n\n')
}

function convertSectionToMarkdown(block: SlackBlock): string {
  let text = ''

  // Main text
  if (block.text) {
    text += convertTextToMarkdown(block.text)
  }

  // Fields
  const fields = block.elements as Array<{ type: string; text?: string }> | undefined
  if (fields) {
    const fieldTexts: string[] = []
    for (const field of fields) {
      if (field.type === 'rich_text_section' || field.type === 'plain_text') {
        fieldTexts.push(field.text || '')
      }
    }
    // Format as bullet list if multiple fields
    if (fieldTexts.length > 0) {
      text += '\n' + fieldTexts.map(f => `- ${f}`).join('\n')
    }
  }

  return text.trim()
}

function convertHeaderToMarkdown(block: SlackBlock): string {
  if (block.text?.text) {
    return `## ${block.text.text}`
  }
  return ''
}

function convertRichTextToMarkdown(block: SlackBlock): string {
  // Rich text block structure
  const elements = block.elements as Array<{
    type: string
    elements?: Array<{ type: string; text?: string; style?: unknown }>
  }> | undefined

  if (!elements) {
    return ''
  }

  const parts: string[] = []

  for (const element of elements) {
    if (element.type === 'rich_text_section') {
      const sectionText = (element.elements || [])
        .map(el => {
          if (el.type === 'text') {
            let text = el.text || ''
            const style = el.style as Record<string, boolean> | undefined
            if (style?.bold) {
              text = `**${text}**`
            }
            if (style?.italic) {
              text = `*${text}*`
            }
            if (style?.strike) {
              text = `~~${text}~~`
            }
            if (style?.code) {
              text = `\`${text}\``
            }
            return text
          }
          return ''
        })
        .join('')
      parts.push(sectionText)
    } else if (element.type === 'rich_text_list') {
      // Handle lists
      const items = (element.elements || [])
        .map((li: { elements?: Array<{ type: string; elements?: Array<{ text?: string }> }> }) => {
          const text = li.elements
            ?.flatMap(e =>
              e.type === 'rich_text_section'
                ? e.elements?.map(te => te.text || '') || []
                : []
            )
            .join('')
          return `- ${text}`
        })
        .join('\n')
      parts.push(items)
    }
  }

  return parts.join('\n')
}

function convertContextToMarkdown(block: SlackBlock): string {
  const elements = block.elements as Array<{
    type: string
    text?: string
    imageUrl?: string
    altText?: string
  }> | undefined

  if (!elements) {
    return ''
  }

  const parts: string[] = []

  for (const element of elements) {
    if (element.type === 'image') {
      parts.push(`![${element.altText || 'image'}](${element.imageUrl})`)
    } else if (element.type === 'plain_text' || element.type === 'mrkdwn') {
      parts.push(element.text || '')
    }
  }

  return parts.join(' ')
}

function convertImageToMarkdown(block: SlackBlock): string {
  // Image blocks have image_url and alt_text in accessory
  const accessory = block.accessary as { image_url?: string; alt_text?: string } | undefined
  if (accessory?.image_url) {
    return `![${accessory.alt_text || 'image'}](${accessory.image_url})`
  }
  return ''
}

function convertTextToMarkdown(text: { type: string; text: string }): string {
  if (text.type === 'mrkdwn') {
    // Convert basic Slack markdown to standard markdown
    let markdown = text.text

    // Bold: *text* or <b>text</b>
    // Note: Slack uses * for bold in mrkdwn

    // Italic: _text_

    // Code: `code`

    // Links: <url|text>
    markdown = markdown.replace(/<([^|>]+)\|([^>]+)>/g, '[$2]($1)')
    markdown = markdown.replace(/<([^|>]+)>/g, '($1)')

    return markdown
  } else if (text.type === 'plain_text') {
    return text.text
  }

  return text.text || ''
}