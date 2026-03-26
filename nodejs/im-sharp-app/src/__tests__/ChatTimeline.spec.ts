import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ChatTimeline from '@/components/ChatTimeline.vue'
import type { ConversationTimelineItem } from '@/types/conversation'
import { MessageStatus, MessageType } from '@/types'

function buildMessageItem(id: string): ConversationTimelineItem {
  return {
    kind: 'message',
    id,
    createdAt: '2026-03-20T10:00:00.000Z',
    showTimestamp: true,
    timestampLabel: '10:00',
    bubble: {
      content: 'hello',
      type: 'Text',
      isSelf: false,
      time: '10:00',
    },
    rawMessage: {
      id,
      senderId: 'friend',
      receiverId: 'self',
      content: 'hello',
      type: MessageType.Text,
      status: MessageStatus.Sent,
      deliveredAt: null,
      readAt: null,
      createdAt: '2026-03-20T10:00:00.000Z',
    },
  }
}

describe('ChatTimeline', () => {
  it('calls onReachTop when scrolled near the top', async () => {
    const onReachTop = vi.fn()
    const wrapper = mount(ChatTimeline, {
      props: {
        items: [buildMessageItem('1')],
        onReachTop,
        canLoadMoreTop: true,
        topLoadThreshold: 48,
      },
    })

    const main = wrapper.find('main')
    Object.defineProperty(main.element, 'scrollTop', {
      value: 12,
      configurable: true,
    })
    await main.trigger('scroll')

    expect(onReachTop).toHaveBeenCalledTimes(1)
  })

  it('does not call onReachTop while a history request is already running', async () => {
    const onReachTop = vi.fn()
    const wrapper = mount(ChatTimeline, {
      props: {
        items: [buildMessageItem('1')],
        onReachTop,
        canLoadMoreTop: true,
        loadingMoreTop: true,
      },
    })

    const main = wrapper.find('main')
    Object.defineProperty(main.element, 'scrollTop', {
      value: 0,
      configurable: true,
    })
    await main.trigger('scroll')

    expect(onReachTop).not.toHaveBeenCalled()
  })
})
