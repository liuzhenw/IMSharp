import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BottomNav from '@/components/BottomNav.vue'

const { mockRoute, chatStore, contactsStore, groupsStore } = vi.hoisted(() => ({
  mockRoute: {
    path: '/chats',
  },
  chatStore: {
    totalUnreadCount: 0,
  },
  contactsStore: {
    pendingRequestsCount: 0,
  },
  groupsStore: {
    totalPendingRequestsCount: 0,
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
}))

vi.mock('@/stores', () => ({
  useChatStore: () => chatStore,
  useContactsStore: () => contactsStore,
  useGroupsStore: () => groupsStore,
}))

describe('BottomNav', () => {
  beforeEach(() => {
    mockRoute.path = '/chats'
    chatStore.totalUnreadCount = 0
    contactsStore.pendingRequestsCount = 0
    groupsStore.totalPendingRequestsCount = 0
  })

  it('通讯录角标显示好友请求和入群请求总数', () => {
    contactsStore.pendingRequestsCount = 2
    groupsStore.totalPendingRequestsCount = 3

    const wrapper = mount(BottomNav, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
        },
      },
    })

    const badges = wrapper.findAllComponents({ name: 'Badge' })
    expect(badges).toHaveLength(1)
    expect(badges[0]?.text()).toBe('5')
  })
})
