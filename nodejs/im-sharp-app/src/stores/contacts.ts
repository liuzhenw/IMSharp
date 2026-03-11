import { ref } from 'vue'
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
      friends.value = friends.value.filter((f) => f.id !== friendId)
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
  }

  return {
    friends,
    receivedRequests,
    sentRequests,
    onlineUsers,
    loadFriends,
    loadReceivedRequests,
    loadSentRequests,
    sendFriendRequest,
    processFriendRequest,
    deleteFriend,
    searchUsers,
    setUserOnline,
    setUserOffline,
    setupSignalRListeners,
  }
})
