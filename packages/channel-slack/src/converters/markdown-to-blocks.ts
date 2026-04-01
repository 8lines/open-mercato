/**
 * Convert markdown to Slack Block Kit
 */

import type { SlackBlock } from './types.js'

/**
 * Convert markdown string to Slack Block Kit blocks
 */
export function convertMarkdownToBlocks(markdown: string): SlackBlock[] {
  if (!markdown || markdown.trim() === '') {
    return []
  }

  const lines = markdown.split('\n')
  const blocks: SlackBlock[] = []

  let currentText = ''
  let inCodeBlock = false
  let codeBlockContent = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        blocks.push(createCodeBlock(codeBlockContent.trim()))
        codeBlockContent = ''
        inCodeBlock = false
      } else {
        // Flush current text
        if (currentText.trim()) {
          blocks.push(...createTextBlocks(currentText.trim()))
          currentText = ''
        }
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n'
      continue
    }

    // Handle headers
    if (line.startsWith('### ')) {
      if (currentText.trim()) {
        blocks.push(...createTextBlocks(currentText.trim()))
        currentText = ''
      }
      blocks.push(createHeaderBlock(line.replace('### ', ''), 'large'))
    } else if (line.startsWith('## ')) {
      if (currentText.trim()) {
        blocks.push(...createTextBlocks(currentText.trim()))
        currentText = ''
      }
      blocks.push(createHeaderBlock(line.replace('## ', ''), 'medium'))
    } else if (line.startsWith('# ')) {
      if (currentText.trim()) {
        blocks.push(...createTextBlocks(currentText.trim()))
        currentText = ''
      }
      blocks.push(createHeaderBlock(line.replace('# ', ''), 'plain_text'))
    }
    // Handle dividers
    else if (line.trim() === '---') {
      if (currentText.trim()) {
        blocks.push(...createTextBlocks(currentText.trim()))
        currentText = ''
      }
      blocks.push({ type: 'divider' })
    }
    // Handle list items
    else if (line.match(/^[-*] /)) {
      if (currentText.trim()) {
        blocks.push(...createTextBlocks(currentText.trim()))
        currentText = ''
      }
      blocks.push(createSectionWithText(`• ${line.replace(/^[-*] /, '')}`))
    }
    // Regular text
    else {
      currentText += line + '\n'
    }
  }

  // Flush remaining text
  if (currentText.trim()) {
    blocks.push(...createTextBlocks(currentText.trim()))
  }

  // If no blocks created, create a simple section
  if (blocks.length === 0) {
    blocks.push(createSectionWithText(markdown))
  }

  return blocks
}

function createSectionWithText(text: string): SlackBlock {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: text,
    },
  }
}

function createTextBlocks(text: string): SlackBlock[] {
  // Split long text into multiple sections if needed (Slack max is 3000 chars)
  const maxLength = 2800
  const blocks: SlackBlock[] = []

  if (text.length <= maxLength) {
    return [createSectionWithText(text)]
  }

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/)
  let currentBlock = ''

  for (const paragraph of paragraphs) {
    if ((currentBlock + '\n\n' + paragraph).length > maxLength) {
      if (currentBlock) {
        blocks.push(createSectionWithText(currentBlock.trim()))
      }
      // If single paragraph exceeds max, split it
      if (paragraph.length > maxLength) {
        const chunks = chunkString(paragraph, maxLength)
        for (const chunk of chunks) {
          blocks.push(createSectionWithText(chunk))
        }
        currentBlock = ''
      } else {
        currentBlock = paragraph
      }
    } else {
      currentBlock = currentBlock ? currentBlock + '\n\n' + paragraph : paragraph
    }
  }

  if (currentBlock.trim()) {
    blocks.push(createSectionWithText(currentBlock.trim()))
  }

  return blocks
}

function createHeaderBlock(text: string, size: string): SlackBlock {
  return {
    type: 'header',
    text: {
      type: 'plain_text' as const,
      text: text,
    },
  }
}

function createCodeBlock(code: string): SlackBlock {
  return {
    type: 'section',
    text: {
      type: 'mrkdwn' as const,
      text: `\`\`\`\n${code}\n\`\`\``,
    },
  }
}

function chunkString(str: string, chunkSize: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize))
  }
  return chunks
}

// Export utility for link conversion
export function convertMarkdownLinkToSlackLink(markdown: string): string {
  // [text](url) -> <url|text>
  return markdown.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<$2|$1>')
}