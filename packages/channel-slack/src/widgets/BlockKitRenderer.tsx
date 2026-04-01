/**
 * Block Kit Renderer - React components for Slack Block Kit
 */

import React from 'react'
import type { SlackBlock, SlackAttachment } from './types.js'

// ============================================================================
// Block Components
// ============================================================================

interface SectionProps {
  text?: { type: string; text: string }
  fields?: Array<{ type: string; text: string }>
  accessory?: React.ReactNode
}

export function Section({ text, fields, accessory }: SectionProps) {
  return (
    <div style={styles.section}>
      {text && <TextContent type={text.type} text={text.text} />}
      {fields && fields.length > 0 && (
        <div style={styles.fields}>
          {fields.map((field, i) => (
            <div key={i} style={styles.field}>
              <TextContent type={field.type} text={field.text} />
            </div>
          ))}
        </div>
      )}
      {accessory && <div style={styles.accessory}>{accessory}</div>}
    </div>
  )
}

export function Header({ text }: { text?: { type: string; text: string } }) {
  if (!text) return null
  return (
    <div style={styles.header}>
      <TextContent type={text.type} text={text.text} />
    </div>
  )
}

export function Divider() {
  return <hr style={styles.divider} />
}

interface ContextProps {
  elements?: Array<{
    type: string
    text?: string
    imageUrl?: string
    altText?: string
  }>
}

export function Context({ elements }: ContextProps) {
  if (!elements) return null
  return (
    <div style={styles.context}>
      {elements.map((el, i) => {
        if (el.type === 'image') {
          return <img key={i} src={el.imageUrl} alt={el.altText} style={styles.contextImage} />
        }
        return <span key={i}>{el.text}</span>
      })}
    </div>
  )
}

interface ImageBlockProps {
  imageUrl?: string
  altText?: string
  title?: string
}

export function ImageBlock({ imageUrl, altText, title }: ImageBlockProps) {
  if (!imageUrl) return null
  return (
    <div style={styles.imageBlock}>
      {title && <div style={styles.imageTitle}>{title}</div>}
      <img src={imageUrl} alt={altText || 'image'} style={styles.image} />
    </div>
  )
}

// ============================================================================
// Attachment Component
// ============================================================================

interface AttachmentProps {
  attachment: SlackAttachment
}

export function Attachment({ attachment }: AttachmentProps) {
  return (
    <div
      style={{
        ...styles.attachment,
        borderLeftColor: attachment.color || '#ddd',
      }}
    >
      {attachment.title && (
        <div style={styles.attachmentTitle}>
          {attachment.title_link ? (
            <a href={attachment.title_link}>{attachment.title}</a>
          ) : (
            attachment.title
          )}
        </div>
      )}
      {attachment.text && <div style={styles.attachmentText}>{attachment.text}</div>}
      {attachment.fields && (
        <div style={styles.attachmentFields}>
          {attachment.fields.map((field, i) => (
            <div key={i} style={field.short ? styles.fieldShort : styles.fieldFull}>
              <div style={styles.fieldTitle}>{field.title}</div>
              <div style={styles.fieldValue}>{field.value}</div>
            </div>
          ))}
        </div>
      )}
      {attachment.image_url && (
        <img src={attachment.image_url} alt="" style={styles.attachmentImage} />
      )}
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

interface TextContentProps {
  type: string
  text: string
}

function TextContent({ type, text }: TextContentProps) {
  if (type === 'mrkdwn') {
    // Basic markdown rendering
    return <span style={styles.markdown} dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
  }
  return <span>{text}</span>
}

function renderMarkdown(text: string): string {
  // Basic markdown to HTML conversion
  let html = text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Convert markdown
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/<(.+?)>/g, (_, url) => {
      // Convert <url|text> to <a href="url">text</a>
      const match = url.match(/([^|]+)\|(.+)/)
      if (match) {
        return `<a href="${match[1]}">${match[2]}</a>`
      }
      return `<a href="${url}">${url}</a>`
    })
    .replace(/\n/g, '<br>')
  return html
}

// ============================================================================
// Main Renderer
// ============================================================================

interface BlockKitRendererProps {
  blocks?: SlackBlock[]
  attachments?: SlackAttachment[]
}

export function BlockKitRenderer({ blocks, attachments }: BlockKitRendererProps) {
  if (!blocks?.length && !attachments?.length) {
    return null
  }

  return (
    <div style={styles.container}>
      {blocks?.map((block, i) => {
        switch (block.type) {
          case 'section':
            return <Section key={i} {...block} />
          case 'header':
            return <Header key={i} text={block.text} />
          case 'divider':
            return <Divider key={i} />
          case 'context':
            return <Context key={i} elements={block.elements as ContextProps['elements']} />
          case 'image':
            return (
              <ImageBlock
                key={i}
                imageUrl={(block.accessory as { image_url?: string })?.image_url}
                altText={(block.accessory as { alt_text?: string })?.alt_text}
              />
            )
          default:
            return null
        }
      })}
      {attachments?.map((att, i) => (
        <Attachment key={i} attachment={att} />
      ))}
    </div>
  )
}

// ============================================================================
// Styles
// ============================================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'Lato, sans-serif',
    fontSize: '15px',
    lineHeight: '1.5',
    color: '#1d1c1d',
  },
  section: {
    padding: '8px 0',
  },
  fields: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '8px',
  },
  field: {
    flex: '1 1 50%',
    minWidth: '100px',
  },
  accessory: {
    marginTop: '8px',
  },
  header: {
    fontSize: '20px',
    fontWeight: 'bold' as const,
    padding: '12px 0 8px',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e0e0e0',
    margin: '8px 0',
  },
  context: {
    fontSize: '13px',
    color: '#616061',
    padding: '8px 0',
  },
  contextImage: {
    verticalAlign: 'middle',
    maxHeight: '24px',
    marginRight: '4px',
  },
  imageBlock: {
    padding: '8px 0',
  },
  imageTitle: {
    fontSize: '13px',
    color: '#616061',
    marginBottom: '4px',
  },
  image: {
    maxWidth: '100%',
    borderRadius: '4px',
  },
  attachment: {
    borderLeft: '4px solid #ddd',
    padding: '8px 12px',
    margin: '8px 0',
    backgroundColor: '#f8f8f8',
    borderRadius: '4px',
  },
  attachmentTitle: {
    fontWeight: 'bold' as const,
    marginBottom: '4px',
  },
  attachmentText: {
    marginTop: '4px',
  },
  attachmentFields: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginTop: '8px',
  },
  fieldShort: {
    flex: '1 1 50%',
  },
  fieldFull: {
    flex: '1 1 100%',
  },
  fieldTitle: {
    fontSize: '12px',
    color: '#616061',
  },
  fieldValue: {
    fontSize: '14px',
  },
  attachmentImage: {
    maxWidth: '100%',
    marginTop: '8px',
    borderRadius: '4px',
  },
  markdown: {
    wordBreak: 'break-word' as const,
  },
}