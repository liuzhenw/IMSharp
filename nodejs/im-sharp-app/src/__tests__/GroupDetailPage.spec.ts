import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GroupDetailPage from '@/pages/GroupDetailPage.vue'

const { mockRoute, push, groupsStore, authStore, uiStore, mediaApi } = vi.hoisted(() => ({
  mockRoute: {
    params: {
      id: 'group-123',
    },
  },
  push: vi.fn(),
  groupsStore: {
    groups: [
      {
        id: 'group-123',
        ownerId: 'user-1',
        name: '测试群组',
        description: 'desc',
        avatar: '',
        groupNumber: 10001,
        memberCount: 1,
        isPublic: true,
        announcement: null,
      },
    ],
    groupMembers: new Map([
      [
        'group-123',
        [
          {
            userId: 'user-1',
            role: 'Owner',
            user: {
              id: 'user-1',
              username: 'owner',
              displayName: '群主',
            },
          },
        ],
      ],
    ]),
    loadGroups: vi.fn(),
    loadGroupMembers: vi.fn().mockResolvedValue([]),
    updateAnnouncement: vi.fn(),
    updateGroup: vi.fn(),
    leaveGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
  authStore: {
    user: {
      id: 'user-1',
    },
  },
  uiStore: {
    showToast: vi.fn(),
  },
  mediaApi: {
    uploadAvatar: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({
    push,
  }),
}))

vi.mock('@/stores', () => ({
  useGroupsStore: () => groupsStore,
  useAuthStore: () => authStore,
  useUiStore: () => uiStore,
}))

vi.mock('@/services', () => ({
  mediaApi,
}))

describe('GroupDetailPage', () => {
  beforeEach(() => {
    push.mockReset()
    groupsStore.loadGroups.mockClear()
    groupsStore.loadGroupMembers.mockClear()
    uiStore.showToast.mockClear()
    mediaApi.uploadAvatar.mockClear()
    groupsStore.groups = [
      {
        id: 'group-123',
        ownerId: 'user-1',
        name: '测试群组',
        description: 'desc',
        avatar: '',
        groupNumber: 10001,
        memberCount: 1,
        isPublic: true,
        announcement: null,
      },
    ]
    groupsStore.groupMembers = new Map([
      [
        'group-123',
        [
          {
            userId: 'user-1',
            role: 'Owner',
            user: {
              id: 'user-1',
              username: 'owner',
              displayName: '群主',
            },
          },
        ],
      ],
    ])
  })

  it('点击返回按钮时固定跳转到当前群聊页面', async () => {
    const wrapper = mount(GroupDetailPage, {
      global: {
        stubs: {
          Header: {
            template: `
              <div>
                <button data-test="back" @click="$emit('back')">back</button>
                <slot name="right" />
              </div>
            `,
          },
          Button: true,
          ConfirmationModal: true,
          LoadingSpinner: true,
        },
      },
    })

    await flushPromises()
    await wrapper.get('[data-test="back"]').trigger('click')

    expect(push).toHaveBeenCalledWith('/groups/group-123/chat')
  })
})
