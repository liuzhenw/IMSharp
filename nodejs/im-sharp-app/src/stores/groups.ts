import {ref, computed} from 'vue'
import {defineStore} from 'pinia'
import {groupsApi} from '@/services'
import {signalRService} from '@/services'
import {messageStorage} from '@/services/messageStorage'
import type {Group, GroupMember, GroupJoinRequest} from '@/types'

function normalizeGroupMember(member: GroupMember): GroupMember {
  return {
    ...member,
    userId: member.userId ?? member.user?.id ?? '',
  }
}

export const useGroupsStore = defineStore('groups', () => {
  // State
  const groups = ref<Group[]>([])
  const groupMembers = ref<Map<string, GroupMember[]>>(new Map())
  const pendingJoinRequests = ref<Map<string, GroupJoinRequest[]>>(new Map()) // 按群组 ID 存储待处理的入群申请

  // Getters
  const totalPendingRequestsCount = computed(() => {
    let total = 0
    for (const requests of pendingJoinRequests.value.values()) {
      total += requests.filter(r => r.status === 'Pending').length
    }
    return total
  })

  // Actions
  async function loadGroups() {
    try {
      const response = await groupsApi.getMyGroups()
      groups.value = response.groups
    } catch (error) {
      console.error('Load groups failed:', error)
      throw error
    }
  }

  async function loadGroupMembers(groupId: string) {
    try {
      const detail = await groupsApi.getDetail(groupId)
      const members = detail.members.map((member) => normalizeGroupMember(member))
      groupMembers.value.set(groupId, members)

      const index = groups.value.findIndex(g => g.id === groupId)
      if (index >= 0) {
        groups.value[index]!.announcement = detail.announcement
        groups.value[index]!.memberCount = members.length
      }
      return members
    } catch (error) {
      console.error('Load group members failed:', error)
      throw error
    }
  }

  async function createGroup(
    name: string,
    memberIds: string[],
    avatar?: string,
    description?: string,
    isPublic: boolean = true
  ) {
    try {
      const group = await groupsApi.create({
        name,
        avatar,
        description,
        memberIds,
        isPublic,
      })
      groups.value.push(group)
      return group
    } catch (error) {
      console.error('Create group failed:', error)
      throw error
    }
  }

  async function updateGroup(groupId: string, data: {
    name?: string;
    avatar?: string;
    description?: string;
    isPublic?: boolean
  }) {
    try {
      const group = await groupsApi.update(groupId, data)
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index >= 0) {
        groups.value[index] = group
      }
      return group
    } catch (error) {
      console.error('Update group failed:', error)
      throw error
    }
  }

  async function inviteMembers(groupId: string, userIds: string[]) {
    try {
      for (const userId of userIds) {
        try {
          await groupsApi.inviteMembers(groupId, {userId})
        } catch (error) {
          const inviteError = new Error(`邀请用户 ${userId} 失败`)
          ;(inviteError as Error & { cause?: unknown }).cause = error
          throw inviteError
        }
      }
      await loadGroupMembers(groupId)
    } catch (error) {
      console.error('Invite members failed:', error)
      throw error
    }
  }

  async function removeMember(groupId: string, userId: string) {
    try {
      await groupsApi.removeMember(groupId, userId)
      const members = groupMembers.value.get(groupId)
      if (members) {
        const updatedMembers = members.filter((m) => m.userId !== userId)
        groupMembers.value.set(groupId, updatedMembers)

        const group = groups.value.find((g) => g.id === groupId)
        if (group) {
          group.memberCount = updatedMembers.length
        }
      }
    } catch (error) {
      console.error('Remove member failed:', error)
      throw error
    }
  }

  async function leaveGroup(groupId: string) {
    try {
      await groupsApi.leave(groupId)
      groups.value = groups.value.filter((g) => g.id !== groupId)
    } catch (error) {
      console.error('Leave group failed:', error)
      throw error
    }
  }

  async function deleteGroup(groupId: string) {
    try {
      await groupsApi.delete(groupId)
      groups.value = groups.value.filter((g) => g.id !== groupId)
    } catch (error) {
      console.error('Delete group failed:', error)
      throw error
    }
  }

  async function searchGroupByNumber(groupNumber: number) {
    try {
      const response = await groupsApi.searchByNumber(groupNumber)
      return response
    } catch (error) {
      console.error('Search group failed:', error)
      throw error
    }
  }

  async function joinGroup(groupNumber: number) {
    try {
      await groupsApi.join(groupNumber)
      await loadGroups()

      // 找到新加入的群组并初始化已读位置
      const newGroup = groups.value.find(g => g.groupNumber === groupNumber)
      if (newGroup) {
        await initializeGroupReadPosition(newGroup.id)
      }
    } catch (error) {
      console.error('Join group failed:', error)
      throw error
    }
  }

  /**
   * 初始化群组的已读位置
   * 在用户加入群组时调用,将加入时刻之前的消息视为已读
   */
  async function initializeGroupReadPosition(groupId: string) {
    try {
      console.log('[Groups] 初始化群组已读位置:', groupId)

      // 1. 尝试从 IndexedDB 获取最新消息 ID
      let lastMessageId = await messageStorage.getLatestGroupMessageId(groupId)

      // 2. 如果 IndexedDB 中没有,尝试从 API 获取
      if (!lastMessageId) {
        try {
          const response = await groupsApi.getMessages(groupId, {limit: 1})
          if (response.messages && response.messages.length > 0) {
            lastMessageId = response.messages[0]!.id
          }
        } catch (apiError) {
          console.debug('[Groups] 无法从 API 获取群组消息:', apiError)
        }
      }

      // 3. 确定已读位置
      const readPosition = lastMessageId || `JOIN_AT_${new Date().toISOString()}`
      console.log('[Groups] 设置已读位置:', {groupId, readPosition})

      // 4. 保存已读位置
      const {useChatStore} = await import('./chat')
      const chatStore = useChatStore()
      await chatStore.saveLastReadPosition(groupId, readPosition)
    } catch (error) {
      // 初始化失败不应阻塞加入群组流程
      console.error('[Groups] 初始化群组已读位置失败:', error)
    }
  }

  async function sendJoinRequest(groupNumber: number, message?: string) {
    try {
      await groupsApi.sendJoinRequest({groupNumber, message})
    } catch (error) {
      console.error('Send join request failed:', error)
      throw error
    }
  }

  async function getGroupJoinRequests(groupId: string) {
    try {
      const response = await groupsApi.getGroupJoinRequests(groupId)
      // 更新缓存
      pendingJoinRequests.value.set(groupId, response.requests)
      return response.requests
    } catch (error) {
      console.error('Get group join requests failed:', error)
      throw error
    }
  }

  // 加载所有我管理的群组的待处理入群申请
  async function loadAllPendingJoinRequests() {
    try {
      pendingJoinRequests.value = new Map()

      // 获取当前用户 ID
      const {useAuthStore} = await import('./auth')
      const authStore = useAuthStore()
      const currentUserId = authStore.user?.id

      if (!currentUserId) {
        console.warn('Cannot load join requests: user not authenticated')
        return
      }

      // 遍历所有群组，只加载我是群主的群组的入群申请
      for (const group of groups.value) {
        // 只加载我是群主的群组
        if (group.ownerId !== currentUserId) {
          continue
        }

        // 尝试加载入群申请
        try {
          const requests = await groupsApi.getGroupJoinRequests(group.id)
          pendingJoinRequests.value.set(group.id, requests.requests)
        } catch (error) {
          // 加载失败，忽略
          console.debug(`Cannot load join requests for group ${group.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Load all pending join requests failed:', error)
    }
  }

  async function getMyJoinRequests() {
    try {
      const response = await groupsApi.getMyJoinRequests()
      return response.requests
    } catch (error) {
      console.error('Get my join requests failed:', error)
      throw error
    }
  }

  async function processJoinRequest(requestId: string, accept: boolean) {
    try {
      await groupsApi.processJoinRequest(requestId, {accept})
    } catch (error) {
      console.error('Process join request failed:', error)
      throw error
    }
  }

  async function updateAnnouncement(groupId: string, announcement: string) {
    try {
      if (announcement.trim()) {
        await groupsApi.setAnnouncement(groupId, announcement)
      } else {
        await groupsApi.clearAnnouncement(groupId)
      }
      // 重新加载群组详情以获取最新公告
      const updated = await groupsApi.getById(groupId)
      const index = groups.value.findIndex((g) => g.id === groupId)
      if (index >= 0) {
        groups.value[index] = updated
      }
    } catch (error) {
      console.error('Update announcement failed:', error)
      throw error
    }
  }

  // 初始化 SignalR 事件监听
  function setupSignalRListeners() {
    // 新成员加入群组
    signalRService.on('GroupMemberJoined', async (member: GroupMember) => {
      const normalizedMember = normalizeGroupMember(member)
      const {useAuthStore} = await import('./auth')
      const authStore = useAuthStore()
      const isCurrentUser = normalizedMember.userId === authStore.user?.id

      if (isCurrentUser) {
        await loadGroups()
      }

      const members = groupMembers.value.get(normalizedMember.groupId)
      if (members) {
        if (!members.find(m => m.userId === normalizedMember.userId)) {
          members.push(normalizedMember)
        }
      }
      // 同步更新群组人数
      const group = groups.value.find(g => g.id === normalizedMember.groupId)
      if (group) {
        group.memberCount = members?.length ?? (group.memberCount || 0) + 1
      }

      // 如果是当前用户加入群组,刷新群信息、初始化已读位置和会话列表
      if (isCurrentUser) {
        console.log('[Groups] 当前用户通过 SignalR 加入群组:', normalizedMember.groupId)
        try {
          await loadGroupMembers(normalizedMember.groupId)
        } catch (error) {
          console.debug('[Groups] 加载新群组详情失败:', error)
        }

        await initializeGroupReadPosition(normalizedMember.groupId)

        try {
          const {useChatStore} = await import('./chat')
          const chatStore = useChatStore()
          await chatStore.loadConversations()
        } catch (error) {
          console.debug('[Groups] 刷新会话列表失败:', error)
        }
      }
    })

    // 成员离开群组
    signalRService.on('MemberLeftGroup', (groupId: string, userId: string) => {
      const members = groupMembers.value.get(groupId)
      if (members) {
        groupMembers.value.set(
          groupId,
          members.filter((m) => m.userId !== userId)
        )
      }
      // 同步更新群组人数
      const group = groups.value.find(g => g.id === groupId)
      if (group && group.memberCount > 0) {
        group.memberCount -= 1
      }
    })

    // 群组信息更新
    signalRService.on('GroupUpdated', (groupId: string) => {
      // 重新加载群组信息
      groupsApi.getById(groupId).then((group) => {
        const index = groups.value.findIndex((g) => g.id === groupId)
        if (index >= 0) {
          groups.value[index] = group
        }
      })
    })

    signalRService.on('GroupJoinRequestReceived', () => {
      loadAllPendingJoinRequests()
    })

    signalRService.on('GroupJoinRequestProcessed', () => {
      loadAllPendingJoinRequests()
    })
  }

  return {
    groups,
    groupMembers,
    pendingJoinRequests,
    totalPendingRequestsCount,
    loadGroups,
    loadGroupMembers,
    createGroup,
    updateGroup,
    inviteMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    searchGroupByNumber,
    joinGroup,
    sendJoinRequest,
    getGroupJoinRequests,
    loadAllPendingJoinRequests,
    getMyJoinRequests,
    processJoinRequest,
    updateAnnouncement,
    setupSignalRListeners,
  }
})
