import { describe, expect, it } from 'vitest'
import {
  buildGroupConversationTimelineItems,
  buildPrivateConversationTimelineItems,
  highlightSearchKeyword,
} from '@/utils/conversation'
import { MessageStatus, MessageType, type GroupMessage, type PrivateMessage } from '@/types'

describe('conversation utils', () => {
  it('builds private timeline timestamps with five minute gaps', () => {
    const messages: PrivateMessage[] = [
      {
        id: '1',
        senderId: 'self',
        receiverId: 'friend',
        content: 'first',
        type: MessageType.Text,
        status: MessageStatus.Sent,
        deliveredAt: null,
        readAt: null,
        createdAt: '2026-03-20T10:00:00.000Z',
      },
      {
        id: '2',
        senderId: 'friend',
        receiverId: 'self',
        content: 'second',
        type: MessageType.Text,
        status: MessageStatus.Delivered,
        deliveredAt: null,
        readAt: null,
        createdAt: '2026-03-20T10:03:00.000Z',
      },
      {
        id: '3',
        senderId: 'friend',
        receiverId: 'self',
        content: 'third',
        type: MessageType.Text,
        status: MessageStatus.Read,
        deliveredAt: null,
        readAt: null,
        createdAt: '2026-03-20T10:10:00.000Z',
      },
    ]

    const timeline = buildPrivateConversationTimelineItems({
      messages,
      currentUserId: 'self',
      selfAvatar: 'self.png',
      otherAvatar: 'friend.png',
    })

    expect(timeline).toHaveLength(3)
    expect(timeline[0]).toMatchObject({ kind: 'message', showTimestamp: true })
    expect(timeline[1]).toMatchObject({ kind: 'message', showTimestamp: false })
    expect(timeline[2]).toMatchObject({ kind: 'message', showTimestamp: true })
  })

  it('builds group timeline while ignoring system events for timestamp gaps', () => {
    const messages: GroupMessage[] = [
      {
        id: 'g1',
        groupId: 'group-1',
        senderId: 'u1',
        content: 'hello',
        type: MessageType.Text,
        createdAt: '2026-03-20T10:00:00.000Z',
      },
      {
        id: 'g2',
        groupId: 'group-1',
        senderId: 'u2',
        content: 'world',
        type: MessageType.Text,
        createdAt: '2026-03-20T10:03:00.000Z',
      },
    ]

    const timeline = buildGroupConversationTimelineItems({
      messages,
      systemEvents: [
        {
          id: 'sys-1',
          type: 'system',
          text: 'someone joined',
          createdAt: '2026-03-20T10:02:00.000Z',
        },
      ],
      currentUserId: 'u1',
      selfAvatar: 'self.png',
      resolveSenderInfo: (message) => ({
        displayName: message.senderId,
        avatar: null,
      }),
    })

    expect(timeline.map((item) => item.kind)).toEqual(['message', 'system', 'message'])
    expect(timeline[0]).toMatchObject({ kind: 'message', showTimestamp: true })
    expect(timeline[2]).toMatchObject({ kind: 'message', showTimestamp: false })
  })

  it('highlights keyword and escapes html content', () => {
    const result = highlightSearchKeyword('<script>alert(1)</script> hello', 'hello')

    expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-700">hello</mark>')
  })
})
