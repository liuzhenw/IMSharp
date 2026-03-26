export interface HistoryCursorState {
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
}

interface HistoryMessage {
  id: string
  createdAt: string
}

export function sortMessagesByCreatedAt<T extends HistoryMessage>(messages: T[]): T[] {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

export function mergeMessages<T extends HistoryMessage>(existing: T[], incoming: T[]): T[] {
  const messageMap = new Map(existing.map((message) => [message.id, message]))

  incoming.forEach((message) => {
    messageMap.set(message.id, message)
  })

  return sortMessagesByCreatedAt(Array.from(messageMap.values()))
}

export function getMessageBoundaries<T extends HistoryMessage>(messages: T[]) {
  if (messages.length === 0) {
    return {
      oldest: null as T | null,
      newest: null as T | null,
    }
  }

  const sorted = sortMessagesByCreatedAt(messages)
  return {
    oldest: sorted[0] ?? null,
    newest: sorted[sorted.length - 1] ?? null,
  }
}

export function createHistoryCursorState<T extends HistoryMessage>(
  messages: T[],
  options?: Partial<HistoryCursorState>,
): HistoryCursorState {
  const { oldest, newest } = getMessageBoundaries(messages)

  return {
    nextCursor: options?.nextCursor ?? oldest?.id ?? null,
    prevCursor: options?.prevCursor ?? newest?.id ?? null,
    hasMore: options?.hasMore ?? Boolean(oldest),
  }
}
