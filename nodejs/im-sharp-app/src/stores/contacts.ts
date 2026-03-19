import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { friendsApi, usersApi } from '@/services'
import { signalRService } from '@/services'
import type { User, FriendRequest } from '@/types'

export const useContactsStore = defineStore('contacts', () => {
  // State
  const friends = ref<User[]>([])
  const receivedRequests = ref<FriendRequest[]>([])
  const sentRequests = ref<FriendRequest[]>([])
  const onlineUsers = ref<Set<string>>(new Set())

  // Computed
  const pendingRequestsCount = computed(() =>
    receivedRequests.value.filter(r => r.status === 'Pending').length
  )

  // Actions
  async function loadFriends() {
    try {
      const response = await friendsApi.getFriends()
      friends.value = response.friends
    } catch (error) {
      console.error('Load friends failed:', error)
      throw error
    }
  }

  async function loadReceivedRequests() {
    try {
      const response = await friendsApi.getReceivedRequests()
      receivedRequests.value = response.requests
    } catch (error) {
      console.error('Load received requests failed:', error)
      throw error
    }
  }

  async function loadSentRequests() {
    try {
      const response = await friendsApi.getSentRequests()
      sentRequests.value = response.requests
    } catch (error) {
      console.error('Load sent requests failed:', error)
      throw error
    }
  }

  async function sendFriendRequest(receiverId: string, message?: string) {
    try {
      await friendsApi.sendRequest({ receiverId, message })
      await loadSentRequests()
    } catch (error) {
      console.error('Send friend request failed:', error)
      throw error
    }
  }

  async function processFriendRequest(id: string, accept: boolean) {
    try {
      await friendsApi.processRequest(id, { accept })
      await loadReceivedRequests()
      if (accept) {
        await loadFriends()
      }
    } catch (error) {
      console.error('Process friend request failed:', error)
      throw error
    }
  }

  async function deleteFriend(friendId: string) {
    try {
      await friendsApi.deleteFriend(friendId)

      // 从好友列表中移除
      friends.value = friends.value.filter((f) => f.id !== friendId)

      // 清理本地消息数据（与被动删除时的逻辑一致）
      const { useChatStore } = await import('./chat')
      const chatStore = useChatStore()
      await chatStore.handleFriendDeleted(friendId)

      console.log(`已删除好友 ${friendId} 及其本地数据`)
    } catch (error) {
      console.error('Delete friend failed:', error)
      throw error
    }
  }

  async function searchUsers(keyword: string) {
    try {
      const response = await usersApi.search(keyword)
      return response.users
    } catch (error) {
      console.error('Search users failed:', error)
      throw error
    }
  }

  function setUserOnline(userId: string) {
    onlineUsers.value.add(userId)
    // 更新好友列表中的在线状态
    const friend = friends.value.find((f) => f.id === userId)
    if (friend) {
      friend.isOnline = true
    }
  }

  function setUserOffline(userId: string) {
    onlineUsers.value.delete(userId)
    // 更新好友列表中的在线状态
    const friend = friends.value.find((f) => f.id === userId)
    if (friend) {
      friend.isOnline = false
    }
  }

  // 处理好友被删除事件
  function handleFriendDeleted(userId: string) {
    // 从好友列表中移除
    friends.value = friends.value.filter((f) => f.id !== userId)
    // 从在线用户集合中移除
    onlineUsers.value.delete(userId)
  }

  // 初始化 SignalR 事件监听
  function setupSignalRListeners() {
    // 用户上线
    signalRService.on('UserOnline', (userId: string) => {
      setUserOnline(userId)
    })

    // 用户下线
    signalRService.on('UserOffline', (userId: string) => {
      setUserOffline(userId)
    })

    // 好友请求通知
    signalRService.on('FriendRequestReceived', () => {
      loadReceivedRequests()
    })

    // 好友请求被接受
    signalRService.on('FriendRequestAccepted', () => {
      loadFriends()
    })

    // 好友请求被处理
    signalRService.on('FriendRequestProcessed', () => {
      loadSentRequests()
    })

    // 好友被添加
    signalRService.on('FriendAdded', () => {
      loadFriends()
    })

    // 好友关系被删除
    signalRService.on('FriendDeleted', (data: { userId: string }) => {
      handleFriendDeleted(data.userId)
    })
  }

  return {
    friends,
    receivedRequests,
    sentRequests,
    onlineUsers,
    pendingRequestsCount,
    loadFriends,
    loadReceivedRequests,
    loadSentRequests,
    sendFriendRequest,
    processFriendRequest,
    deleteFriend,
    searchUsers,
    setUserOnline,
    setUserOffline,
    handleFriendDeleted,
    setupSignalRListeners,
  }
})
