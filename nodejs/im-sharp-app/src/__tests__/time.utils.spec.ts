import { beforeEach, describe, expect, it, vi } from 'vitest'
import { formatConversationTime } from '@/utils/time'

describe('time utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-26T10:00:00.000+08:00'))
  })

  it('formats future timestamps as clock time instead of negative day offsets', () => {
    expect(formatConversationTime('2026-03-27T09:00:00.000+08:00')).toBe('09:00')
  })

  it('formats recent past timestamps by local calendar day', () => {
    expect(formatConversationTime('2026-03-26T08:30:00.000+08:00')).toBe('08:30')
    expect(formatConversationTime('2026-03-25T23:30:00.000+08:00')).toBe('昨天')
    expect(formatConversationTime('2026-03-23T12:00:00.000+08:00')).toBe('3天前')
  })
})
