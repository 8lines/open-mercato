/**
 * Reaction Bar Widget - Injection Configuration
 * 
 * This widget integrates with the Messages module UI to display and manage reactions.
 */

import type { InjectionWidgetModule } from '@open-mercato/shared/modules/widgets/injection'
import ReactionBarWidget from './ReactionBarWidget'

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

export interface GroupedReaction {
  emoji: string
  count: number
  users: string[]
  currentUserReacted: boolean
}

const reactionBarInjection: InjectionWidgetModule<ReactionBarContext, ReactionBarData> = {
  metadata: {
    id: 'communication-channels.reaction-bar',
    title: 'Reactions',
    description: 'Display and manage message reactions',
    priority: 10,
    enabled: true,
  },
  Widget: ReactionBarWidget,
}

export default reactionBarInjection