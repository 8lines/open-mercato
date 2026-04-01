"use client"

import * as React from 'react'
import { cn } from '@open-mercato/shared/lib/utils'
import { apiCall } from '@open-mercato/ui/backend/utils/apiCall'
import type { InjectionWidgetComponentProps } from '@open-mercato/shared/modules/widgets/injection'

export interface GroupedReaction {
  emoji: string
  count: number
  users: string[]
  currentUserReacted: boolean
}

export interface ReactionBarContext {
  messageId: string
  channelLinkId: string
  organizationId: string
  tenantId: string
  userId?: string
}

export interface ReactionBarData {
  reactions: GroupedReaction[]
}

interface ReactionBarWidgetProps extends InjectionWidgetComponentProps<ReactionBarContext, ReactionBarData> {}

// Common emoji reactions
const COMMON_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🔥']

export function ReactionBarWidget({ context, data, disabled }: ReactionBarWidgetProps) {
  const reactions = data?.reactions ?? []
  const [showPicker, setShowPicker] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const pickerRef = React.useRef<HTMLDivElement>(null)

  // Close picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPicker])

  const handleAddReaction = React.useCallback(
    async (emoji: string) => {
      if (disabled || isLoading) return

      try {
        setIsLoading(true)
        await apiCall('/api/communication-channels/reactions', {
          method: 'POST',
          body: JSON.stringify({
            messageId: context.messageId,
            channelLinkId: context.channelLinkId,
            emoji,
          }),
        })
        setShowPicker(false)
      } catch (error) {
        console.error('Failed to add reaction:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [context.messageId, context.channelLinkId, disabled, isLoading]
  )

  const handleRemoveReaction = React.useCallback(
    async (emoji: string) => {
      if (disabled || isLoading) return

      try {
        setIsLoading(true)
        await apiCall('/api/communication-channels/reactions', {
          method: 'DELETE',
          body: JSON.stringify({
            messageId: context.messageId,
            channelLinkId: context.channelLinkId,
            emoji,
          }),
        })
      } catch (error) {
        console.error('Failed to remove reaction:', error)
      } finally {
        setIsLoading(false)
      }
    },
    [context.messageId, context.channelLinkId, disabled, isLoading]
  )

  const handleReactionClick = React.useCallback(
    (reaction: GroupedReaction) => {
      if (reaction.currentUserReacted) {
        handleRemoveReaction(reaction.emoji)
      } else {
        handleAddReaction(reaction.emoji)
      }
    },
    [handleAddReaction, handleRemoveReaction]
  )

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {/* Existing reactions */}
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleReactionClick(reaction)}
          disabled={disabled || isLoading}
          className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-sm transition-colors',
            'hover:bg-muted/50',
            reaction.currentUserReacted
              ? 'bg-primary/10 border border-primary/20'
              : 'bg-muted/30 border border-transparent',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          title={`${reaction.users.join(', ')}`}
        >
          <span>{reaction.emoji}</span>
          {reaction.count > 1 && (
            <span className={cn('text-xs', reaction.currentUserReacted ? 'font-medium' : 'text-muted-foreground')}>
              {reaction.count}
            </span>
          )}
        </button>
      ))}

      {/* Add reaction button */}
      {!disabled && (
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setShowPicker(!showPicker)}
            disabled={isLoading}
            className={cn(
              'inline-flex items-center justify-center w-7 h-7 rounded-full',
              'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              'transition-colors text-sm',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Add reaction"
          >
            😀
          </button>

          {/* Emoji picker dropdown */}
          {showPicker && (
            <div className="absolute bottom-full left-0 mb-1 p-1.5 bg-background rounded-lg border shadow-md z-50 flex gap-0.5">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleAddReaction(emoji)}
                  disabled={isLoading}
                  className={cn(
                    'w-8 h-8 flex items-center justify-center rounded hover:bg-muted/50',
                    'text-lg transition-transform hover:scale-110',
                    isLoading && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ReactionBarWidget