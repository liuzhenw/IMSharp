import { formatDate, formatTime } from './time'
import type {
  ConversationBubbleViewModel,
  ConversationMessageStatus,
  ConversationSearchResult,
  ConversationSystemEvent,
  ConversationTimelineItem,
} from '@/types/conversation'
import type { GroupMessage, PrivateMessage } from '@/types'

const TIMESTAMP_GAP_MS = 5 * 60 * 1000

interface SenderInfo {
  displayName: string
  avatar: string | null
}

function sortByCreatedAt<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

function toTimestampLabel(createdAt: string): string {
  return `${formatDate(createdAt)} ${formatTime(createdAt)}`
}

function toMessageStatus(status?: string): ConversationMessageStatus | undefined {
  if (!status) {
    return undefined
  }

  const normalized = status.toLowerCase() as ConversationMessageStatus
  return ['sending', 'sent', 'delivered', 'read', 'failed'].includes(normalized)
    ? normalized
    : undefined
}

export function buildPrivateConversationTimelineItems(options: {
  messages: PrivateMessage[]
  currentUserId?: string | null
  selfAvatar?: string | null
  otherAvatar?: string | null
}): ConversationTimelineItem[] {
  const sortedMessages = sortByCreatedAt(options.messages)

  return sortedMessages.map((message, index) => {
    const previousMessage = index > 0 ? sortedMessages[index - 1] : null
    const showTimestamp =
      !previousMessage ||
      new Date(message.createdAt).getTime() - new Date(previousMessage.createdAt).getTime() >
        TIMESTAMP_GAP_MS

    const isSelf = message.senderId === options.currentUserId
    const bubble: ConversationBubbleViewModel = {
      content: message.content,
      type: message.type,
      isSelf,
      time: formatTime(message.createdAt),
      status: toMessageStatus(message.status),
      avatar: isSelf ? (options.selfAvatar ?? undefined) : (options.otherAvatar ?? undefined),
    }

    return {
      kind: 'message',
      id: message.id,
      createdAt: message.createdAt,
      showTimestamp,
      timestampLabel: toTimestampLabel(message.createdAt),
      bubble,
      rawMessage: message,
    }
  })
}

export function buildGroupConversationTimelineItems(options: {
  messages: GroupMessage[]
  systemEvents?: ConversationSystemEvent[]
  currentUserId?: string | null
  selfAvatar?: string | null
  resolveSenderInfo: (message: GroupMessage) => SenderInfo
}): ConversationTimelineItem[] {
  const items: ConversationTimelineItem[] = [
    ...sortByCreatedAt(options.messages).map((message) => {
      const sender = options.resolveSenderInfo(message)
      const senderId = message.senderId || message.sender?.id
      const isSelf = senderId === options.currentUserId
      const bubble: ConversationBubbleViewModel = {
        content: message.content,
        type: message.type,
        isSelf,
        time: formatTime(message.createdAt),
        avatar: isSelf ? (options.selfAvatar ?? undefined) : (sender.avatar ?? undefined),
        senderName: isSelf ? undefined : sender.displayName,
      }

      return {
        kind: 'message' as const,
        id: message.id,
        createdAt: message.createdAt,
        showTimestamp: false,
        timestampLabel: toTimestampLabel(message.createdAt),
        bubble,
        rawMessage: message,
      }
    }),
    ...(options.systemEvents ?? []).map((event) => ({
      kind: 'system' as const,
      id: event.id,
      createdAt: event.createdAt,
      text: event.text,
    })),
  ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  let previousMessageAt: string | null = null

  return items.map((item) => {
    if (item.kind === 'system') {
      return item
    }

    const showTimestamp =
      !previousMessageAt ||
      new Date(item.createdAt).getTime() - new Date(previousMessageAt).getTime() > TIMESTAMP_GAP_MS

    previousMessageAt = item.createdAt

    return {
      ...item,
      showTimestamp,
    }
  })
}

export function escapeHtml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function escapeRegExp(content: string): string {
  return content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function highlightSearchKeyword(text: string, keyword: string): string {
  const safeText = escapeHtml(text)
  const trimmedKeyword = keyword.trim()

  if (!trimmedKeyword) {
    return safeText
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedKeyword)})`, 'gi')
  return safeText.replace(pattern, '<mark class="bg-yellow-200 dark:bg-yellow-700">$1</mark>')
}

export function toConversationSearchResult(options: {
  id: string
  title: string
  content: string
  createdAt: string
  keyword: string
}): ConversationSearchResult {
  return {
    id: options.id,
    title: options.title,
    contentHtml: highlightSearchKeyword(options.content, options.keyword),
    timeLabel: formatTime(options.createdAt),
  }
}
