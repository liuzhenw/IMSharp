import { ref } from 'vue'
import { defineStore } from 'pinia'
import { groupsApi } from '@/services'
import { signalRService } from '@/services'
import type { Group, User } from '@/types'

export const useGroupsStore = defineStore('groups', () => {
  // State
  const groups = ref<Group[]>([])
  const groupMembers = ref<Map<string, User[]>>(new Map())

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
      const response = await groupsApi.getMembers(groupId)
      groupMembers.value.set(groupId, response.members)
      return response.members
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

  async function updateGroup(groupId: string, name?: string, avatar?: string, description?: string) {
    try {
      const group = await groupsApi.update(groupId, { name, avatar, description })
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
      await groupsApi.inviteMembers(groupId, { userIds })
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
        groupMembers.value.set(
          groupId,
          members.filter((m) => m.id !== userId)
        )
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

  // 初始化 SignalR 事件监听
  function setupSignalRListeners() {
    // 群组邀请通知
    signalRService.on('GroupInvitationReceived', () => {
      loadGroups()
    })

    // 新成员加入群组
    signalRService.on('MemberJoinedGroup', (groupId: string, user: User) => {
      const members = groupMembers.value.get(groupId)
      if (members) {
        members.push(user)
      }
    })

    // 成员离开群组
    signalRService.on('MemberLeftGroup', (groupId: string, userId: string) => {
      const members = groupMembers.value.get(groupId)
      if (members) {
        groupMembers.value.set(
          groupId,
          members.filter((m) => m.id !== userId)
        )
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
  }

  return {
    groups,
    groupMembers,
    loadGroups,
    loadGroupMembers,
    createGroup,
    updateGroup,
    inviteMembers,
    removeMember,
    leaveGroup,
    deleteGroup,
    setupSignalRListeners,
  }
})
