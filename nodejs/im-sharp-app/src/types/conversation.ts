import type { GroupMessage, PrivateMessage, MessageType } from './models'

export type ConversationMessage = PrivateMessage | GroupMessage
export type ConversationMessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ConversationBubbleViewModel {
  content: string
  type: MessageType | 'Text' | 'Image' | 'File' | 'Audio' | 'Video'
  isSelf: boolean
  time: string
  status?: ConversationMessageStatus
  avatar?: string
  senderName?: string
}

export interface ConversationTimelineMessageItem {
  kind: 'message'
  id: string
  createdAt: string
  showTimestamp: boolean
  timestampLabel: string
  bubble: ConversationBubbleViewModel
  rawMessage: ConversationMessage
}

export interface ConversationTimelineSystemItem {
  kind: 'system'
  id: string
  createdAt: string
  text: string
}

export type ConversationTimelineItem =
  | ConversationTimelineMessageItem
  | ConversationTimelineSystemItem

export interface ConversationSystemEvent {
  id: string
  type: 'system'
  text: string
  createdAt: string
}

export interface ConversationSearchResult {
  id: string
  title: string
  contentHtml: string
  timeLabel: string
}
