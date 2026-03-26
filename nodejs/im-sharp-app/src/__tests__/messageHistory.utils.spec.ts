import { describe, expect, it } from 'vitest'
import {
  createHistoryCursorState,
  getMessageBoundaries,
  mergeMessages,
  sortMessagesByCreatedAt,
} from '@/utils/messageHistory'

describe('messageHistory utils', () => {
  it('sorts messages by createdAt ascending', () => {
    const sorted = sortMessagesByCreatedAt([
      { id: '2', createdAt: '2026-03-20T10:02:00.000Z' },
      { id: '1', createdAt: '2026-03-20T10:01:00.000Z' },
      { id: '3', createdAt: '2026-03-20T10:03:00.000Z' },
    ])

    expect(sorted.map((message) => message.id)).toEqual(['1', '2', '3'])
  })

  it('merges duplicate messages and keeps chronological order', () => {
    const merged = mergeMessages(
      [
        { id: '1', createdAt: '2026-03-20T10:01:00.000Z', content: 'first' },
        { id: '2', createdAt: '2026-03-20T10:02:00.000Z', content: 'old' },
      ],
      [
        { id: '2', createdAt: '2026-03-20T10:02:00.000Z', content: 'updated' },
        { id: '3', createdAt: '2026-03-20T10:03:00.000Z', content: 'third' },
      ],
    )

    expect(merged).toHaveLength(3)
    expect(merged.map((message) => message.id)).toEqual(['1', '2', '3'])
    expect(merged[1]?.content).toBe('updated')
  })

  it('derives cursor boundaries from loaded messages', () => {
    const messages = [
      { id: 'oldest', createdAt: '2026-03-20T10:01:00.000Z' },
      { id: 'newest', createdAt: '2026-03-20T10:03:00.000Z' },
      { id: 'middle', createdAt: '2026-03-20T10:02:00.000Z' },
    ]

    expect(getMessageBoundaries(messages)).toMatchObject({
      oldest: { id: 'oldest' },
      newest: { id: 'newest' },
    })

    expect(createHistoryCursorState(messages, { hasMore: true })).toEqual({
      nextCursor: 'oldest',
      prevCursor: 'newest',
      hasMore: true,
    })
  })

  it('allows rebuilding cursor state with a refreshed hasMore flag', () => {
    const messages = [
      { id: 'oldest', createdAt: '2026-03-20T10:01:00.000Z' },
      { id: 'newest', createdAt: '2026-03-20T10:03:00.000Z' },
    ]

    expect(createHistoryCursorState(messages, { hasMore: false })).toEqual({
      nextCursor: 'oldest',
      prevCursor: 'newest',
      hasMore: false,
    })

    expect(createHistoryCursorState(messages, { hasMore: true })).toEqual({
      nextCursor: 'oldest',
      prevCursor: 'newest',
      hasMore: true,
    })
  })
})
