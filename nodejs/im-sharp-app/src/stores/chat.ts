import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { messagesApi, groupsApi } from '@/services'
import { signalRService } from '@/services'
import { messageStorage } from '@/services/messageStorage'
import type { PrivateMessage, GroupMessage, User } from '@/types'
import { MessageStatus } from '@/types'

// 会话类型
interface Conversation {
  id: string // 好友 ID 或群组 ID
  type: 'private' | 'group'
  name: string
  avatar: string | null
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
  isOnline?: boolean
  user?: User
}

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const privateMessages = ref<Map<string, PrivateMessage[]>>(new Map())
  const groupMessages = ref<Map<string, GroupMessage[]>>(new Map())
  const unreadCounts = ref<Map<string, number>>(new Map())
  const typingUsers = ref<Map<string, boolean>>(new Map())
  const currentUserId = ref<string | null>(null)
  const currentChatId = ref<string | null>(null) // 当前正在查看的聊天 ID

  // 已读位置管理 - 保存每个会话最后一条已读消息的 ID
  const lastReadMessageIds = ref<Map<string, string>>(new Map())

  // 游标状态管理
  const privateCursors = ref<Map<string, {
    nextCursor: string | null  // 用于加载更早的历史消息
    prevCursor: string | null  // 用于加载更新的消息
    hasMore: boolean           // 是否还有更多历史消息
  }>>(new Map())

  const groupCursors = ref<Map<string, {
    nextCursor: string | null
    prevCursor: string | null
    hasMore: boolean
  }>>(new Map())

  // Getters
  const totalUnreadCount = computed(() => {
    return Array.from(unreadCounts.value.values()).reduce((sum, count) => sum + count, 0)
  })

  const sortedConversations = computed(() => {
    return [...conversations.value].map(c => ({
      ...c,
      // 动态获取最新的未读数
      unreadCount: unreadCounts.value.get(c.id) || 0
    })).sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
      return timeB - timeA
    })
  })

  // Actions
  async function loadConversations() {
    try {
      // 从好友列表和群组列表构建会话列表
      const { useContactsStore } = await import('./contacts')
      const { useGroupsStore } = await import('./groups')

      const contactsStore = useContactsStore()
      const groupsStore = useGroupsStore()

      // 加载好友列表
      if (contactsStore.friends.length === 0) {
        await contactsStore.loadFriends()
      }

      // 加载群组列表
      if (groupsStore.groups.length === 0) {
        await groupsStore.loadGroups()
      }

      // 从好友构建私聊会话
      const friendConversations: Conversation[] = contactsStore.friends.map(friend => ({
        id: friend.id,
        type: 'private' as const,
        name: friend.displayName || friend.username,
        avatar: friend.avatar,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: unreadCounts.value.get(friend.id) || 0,
        isOnline: friend.isOnline,
        user: friend,
      }))

      // 从群组构建群聊会话
      const groupConversations: Conversation[] = groupsStore.groups.map(group => ({
        id: group.id,
        type: 'group' as const,
        name: group.name,
        avatar: group.avatar,
        lastMessage: null,
        lastMessageTime: null,
        unreadCount: unreadCounts.value.get(group.id) || 0,
      }))

      conversations.value = [...friendConversations, ...groupConversations]
    } catch (error) {
      console.error('Load conversations failed:', error)
      throw error
    }
  }

  // 消息去重和合并辅助函数
  function mergeMessages<T extends { id: string; createdAt: string }>(
    existing: T[],
    newMessages: T[]
  ): T[] {
    // 使用 Map 去重
    const messageMap = new Map(existing.map(m => [m.id, m]))
    newMessages.forEach(m => messageMap.set(m.id, m))

    // 转换为数组并按时间排序
    const merged = Array.from(messageMap.values()).sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })

    return merged
  }

  async function loadPrivateMessages(
    friendId: string,
    options?: { limit?: number }
  ) {
    try {
      // 1. 获取最后已读消息 ID
      const lastReadMessageId = lastReadMessageIds.value.get(friendId)

      // 2. 如果有最后已读位置，只加载该位置之后的新消息
      if (lastReadMessageId) {
        const response = await messagesApi.getConversation(friendId, {
          after: lastReadMessageId,
          limit: options?.limit || 50,
        })

        // 如果有新消息，更新消息列表
        if (response.messages.length > 0) {
          const existing = privateMessages.value.get(friendId) || []
          const merged = mergeMessages(existing, response.messages)
          privateMessages.value.set(friendId, merged)

          // 更新游标状态
          privateCursors.value.set(friendId, {
            nextCursor: response.nextCursor,
            prevCursor: response.prevCursor,
            hasMore: response.hasMore,
          })

          // 保存到 IndexedDB
          await messageStorage.savePrivateMessages(response.messages)
        }

        return response
      }

      // 3. 首次加载：先从 IndexedDB 加载缓存消息（快速显示）
      if (currentUserId.value) {
        const cachedMessages = await messageStorage.getPrivateMessages(
          friendId,
          currentUserId.value
        )
        if (cachedMessages.length > 0) {
          privateMessages.value.set(friendId, cachedMessages)
        }
      }

      // 4. 从 API 加载最新消息（不提供 before/after）
      const response = await messagesApi.getConversation(friendId, {
        limit: options?.limit || 50,
      })

      // 5. 更新消息列表（覆盖缓存）
      privateMessages.value.set(friendId, response.messages)

      // 6. 更新游标状态
      privateCursors.value.set(friendId, {
        nextCursor: response.nextCursor,
        prevCursor: response.prevCursor,
        hasMore: response.hasMore,
      })

      // 7. 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.savePrivateMessages(response.messages)

        // 8. 保存最后一条消息的 ID 作为已读位置
        const lastMessage = response.messages[response.messages.length - 1]
        if (lastMessage) {
          lastReadMessageIds.value.set(friendId, lastMessage.id)
        }
      }

      return response
    } catch (error) {
      console.error('Load private messages failed:', error)
      throw error
    }
  }

  // 加载更早的历史消息（向上滚动）
  async function loadOlderPrivateMessages(
    friendId: string,
    options?: { limit?: number }
  ) {
    try {
      const cursor = privateCursors.value.get(friendId)
      if (!cursor?.hasMore || !cursor.nextCursor) {
        return { messages: [], hasMore: false, nextCursor: null, prevCursor: null }
      }

      // 使用 nextCursor 加载更早的消息
      const response = await messagesApi.getConversation(friendId, {
        before: cursor.nextCursor,
        limit: options?.limit || 50,
      })

      // 合并消息（去重）
      const existing = privateMessages.value.get(friendId) || []
      const merged = mergeMessages(existing, response.messages)
      privateMessages.value.set(friendId, merged)

      // 更新游标状态
      privateCursors.value.set(friendId, {
        nextCursor: response.nextCursor,
        prevCursor: cursor.prevCursor, // 保持原有的 prevCursor
        hasMore: response.hasMore,
      })

      // 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.savePrivateMessages(response.messages)
      }

      return response
    } catch (error) {
      console.error('Load older private messages failed:', error)
      throw error
    }
  }

  // 加载更新的消息（向下滚动或刷新）
  async function loadNewerPrivateMessages(
    friendId: string,
    options?: { limit?: number }
  ) {
    try {
      const cursor = privateCursors.value.get(friendId)
      if (!cursor?.prevCursor) {
        return { messages: [], hasMore: false, nextCursor: null, prevCursor: null }
      }

      // 使用 prevCursor 加载更新的消息
      const response = await messagesApi.getConversation(friendId, {
        after: cursor.prevCursor,
        limit: options?.limit || 50,
      })

      // 合并消息（去重）
      const existing = privateMessages.value.get(friendId) || []
      const merged = mergeMessages(existing, response.messages)
      privateMessages.value.set(friendId, merged)

      // 更新游标状态
      privateCursors.value.set(friendId, {
        nextCursor: cursor.nextCursor, // 保持原有的 nextCursor
        prevCursor: response.prevCursor,
        hasMore: cursor.hasMore,
      })

      // 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.savePrivateMessages(response.messages)
      }

      return response
    } catch (error) {
      console.error('Load newer private messages failed:', error)
      throw error
    }
  }

  async function loadGroupMessages(
    groupId: string,
    options?: { limit?: number }
  ) {
    try {
      // 1. 获取最后已读消息 ID
      const lastReadMessageId = lastReadMessageIds.value.get(groupId)

      // 2. 如果有最后已读位置，只加载该位置之后的新消息
      if (lastReadMessageId) {
        const response = await groupsApi.getMessages(groupId, {
          after: lastReadMessageId,
          limit: options?.limit || 50,
        })

        // 如果有新消息，更新消息列表
        if (response.messages.length > 0) {
          const existing = groupMessages.value.get(groupId) || []
          const merged = mergeMessages(existing, response.messages)
          groupMessages.value.set(groupId, merged)

          // 更新游标状态
          groupCursors.value.set(groupId, {
            nextCursor: response.nextCursor,
            prevCursor: response.prevCursor,
            hasMore: response.hasMore,
          })

          // 保存到 IndexedDB
          await messageStorage.saveGroupMessages(response.messages)
        }

        return response
      }

      // 3. 首次加载：先从 IndexedDB 加载缓存消息（快速显示）
      const cachedMessages = await messageStorage.getGroupMessages(groupId)
      if (cachedMessages.length > 0) {
        groupMessages.value.set(groupId, cachedMessages)
      }

      // 4. 从 API 加载最新消息（不提供 before/after）
      const response = await groupsApi.getMessages(groupId, {
        limit: options?.limit || 50,
      })

      // 5. 更新消息列表（覆盖缓存）
      groupMessages.value.set(groupId, response.messages)

      // 6. 更新游标状态
      groupCursors.value.set(groupId, {
        nextCursor: response.nextCursor,
        prevCursor: response.prevCursor,
        hasMore: response.hasMore,
      })

      // 7. 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.saveGroupMessages(response.messages)

        // 8. 保存最后一条消息的 ID 作为已读位置
        const lastMessage = response.messages[response.messages.length - 1]
        if (lastMessage) {
          lastReadMessageIds.value.set(groupId, lastMessage.id)
        }
      }

      return response
    } catch (error) {
      console.error('Load group messages failed:', error)
      throw error
    }
  }

  // 加载更早的群聊历史消息（向上滚动）
  async function loadOlderGroupMessages(
    groupId: string,
    options?: { limit?: number }
  ) {
    try {
      const cursor = groupCursors.value.get(groupId)
      if (!cursor?.hasMore || !cursor.nextCursor) {
        return { messages: [], hasMore: false, nextCursor: null, prevCursor: null }
      }

      // 使用 nextCursor 加载更早的消息
      const response = await groupsApi.getMessages(groupId, {
        before: cursor.nextCursor,
        limit: options?.limit || 50,
      })

      // 合并消息（去重）
      const existing = groupMessages.value.get(groupId) || []
      const merged = mergeMessages(existing, response.messages)
      groupMessages.value.set(groupId, merged)

      // 更新游标状态
      groupCursors.value.set(groupId, {
        nextCursor: response.nextCursor,
        prevCursor: cursor.prevCursor, // 保持原有的 prevCursor
        hasMore: response.hasMore,
      })

      // 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.saveGroupMessages(response.messages)
      }

      return response
    } catch (error) {
      console.error('Load older group messages failed:', error)
      throw error
    }
  }

  // 加载更新的群聊消息（向下滚动或刷新）
  async function loadNewerGroupMessages(
    groupId: string,
    options?: { limit?: number }
  ) {
    try {
      const cursor = groupCursors.value.get(groupId)
      if (!cursor?.prevCursor) {
        return { messages: [], hasMore: false, nextCursor: null, prevCursor: null }
      }

      // 使用 prevCursor 加载更新的消息
      const response = await groupsApi.getMessages(groupId, {
        after: cursor.prevCursor,
        limit: options?.limit || 50,
      })

      // 合并消息（去重）
      const existing = groupMessages.value.get(groupId) || []
      const merged = mergeMessages(existing, response.messages)
      groupMessages.value.set(groupId, merged)

      // 更新游标状态
      groupCursors.value.set(groupId, {
        nextCursor: cursor.nextCursor, // 保持原有的 nextCursor
        prevCursor: response.prevCursor,
        hasMore: cursor.hasMore,
      })

      // 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.saveGroupMessages(response.messages)
      }

      return response
    } catch (error) {
      console.error('Load newer group messages failed:', error)
      throw error
    }
  }

  async function sendPrivateMessage(receiverId: string, content: string, type: string = 'Text') {
    try {
      await signalRService.sendMessage(receiverId, content, type)
    } catch (error) {
      console.error('Send private message failed:', error)
      throw error
    }
  }

  async function sendGroupMessage(groupId: string, content: string, type: string = 'Text') {
    try {
      await signalRService.sendGroupMessage(groupId, content, type)
    } catch (error) {
      console.error('Send group message failed:', error)
      throw error
    }
  }

  async function markAsRead(messageId: string) {
    try {
      await signalRService.markMessageAsRead(messageId)
    } catch (error) {
      console.error('Mark message as read failed:', error)
      throw error
    }
  }

  async function markAllAsRead(friendId: string) {
    try {
      await messagesApi.markAllAsRead(friendId)
      unreadCounts.value.set(friendId, 0)
    } catch (error) {
      console.error('Mark all as read failed:', error)
      throw error
    }
  }

  function addPrivateMessage(message: PrivateMessage) {
    // 确定会话 ID (对方的 ID)
    const conversationId = message.senderId === currentUserId.value
      ? message.receiverId
      : message.senderId

    if (!privateMessages.value.has(conversationId)) {
      privateMessages.value.set(conversationId, [])
    }

    const messages = privateMessages.value.get(conversationId)
    if (messages) {
      messages.push(message)
    }

    // 更新已读位置（保存最新消息的 ID）
    lastReadMessageIds.value.set(conversationId, message.id)

    // 保存到 IndexedDB (异步,不阻塞 UI)
    messageStorage.savePrivateMessage(message).catch(err => {
      console.error('保存消息到 IndexedDB 失败:', err)
    })

    // 更新会话列表
    updateConversation(conversationId, 'private', message.content, message.createdAt)

    // 只有接收到的消息才增加未读数,且不在当前查看的聊天中
    if (message.receiverId === currentUserId.value && conversationId !== currentChatId.value) {
      const currentUnread = unreadCounts.value.get(conversationId) || 0
      unreadCounts.value.set(conversationId, currentUnread + 1)
    }
  }

  function addGroupMessage(message: GroupMessage) {
    if (!groupMessages.value.has(message.groupId)) {
      groupMessages.value.set(message.groupId, [])
    }

    const messages = groupMessages.value.get(message.groupId)
    if (messages) {
      messages.push(message)
    }

    // 更新已读位置（保存最新消息的 ID）
    lastReadMessageIds.value.set(message.groupId, message.id)

    // 保存到 IndexedDB (异步,不阻塞 UI)
    messageStorage.saveGroupMessage(message).catch(err => {
      console.error('保存群聊消息到 IndexedDB 失败:', err)
    })

    // 更新会话列表
    updateConversation(message.groupId, 'group', message.content, message.createdAt)

    // 更新未读数
    const currentUnread = unreadCounts.value.get(message.groupId) || 0
    unreadCounts.value.set(message.groupId, currentUnread + 1)
  }

  async function updateConversation(
    id: string,
    type: 'private' | 'group',
    lastMessage: string,
    lastMessageTime: string
  ) {
    const index = conversations.value.findIndex((c) => c.id === id)

    if (index >= 0) {
      const conversation = conversations.value[index]
      if (conversation) {
        conversation.lastMessage = lastMessage
        conversation.lastMessageTime = lastMessageTime
        conversation.unreadCount = unreadCounts.value.get(id) || 0
      }
    } else {
      // 新会话,添加到列表
      const { useContactsStore } = await import('./contacts')
      const { useGroupsStore } = await import('./groups')
      const contactsStore = useContactsStore()
      const groupsStore = useGroupsStore()

      let name = ''
      let avatar: string | null = null
      let isOnline = false
      let user: User | undefined

      if (type === 'private') {
        const friend = contactsStore.friends.find((f: User) => f.id === id)
        if (friend) {
          name = friend.displayName || friend.username
          avatar = friend.avatar
          isOnline = friend.isOnline
          user = friend
        }
      } else {
        const group = groupsStore.groups.find((g: any) => g.id === id)
        if (group) {
          name = group.name
          avatar = group.avatar
        }
      }

      conversations.value.push({
        id,
        type,
        name,
        avatar,
        lastMessage,
        lastMessageTime,
        unreadCount: unreadCounts.value.get(id) || 0,
        isOnline,
        user,
      })
    }
  }

  function setTypingStatus(userId: string, isTyping: boolean) {
    typingUsers.value.set(userId, isTyping)

    // 3 秒后自动清除正在输入状态
    if (isTyping) {
      setTimeout(() => {
        typingUsers.value.set(userId, false)
      }, 3000)
    }
  }

  // 初始化 SignalR 事件监听
  function setupSignalRListeners() {
    // 接收私聊消息
    signalRService.on('ReceiveMessage', (message: PrivateMessage) => {
      addPrivateMessage(message)
    })

    // 消息已发送 (回显) - 用于显示自己发送的消息
    signalRService.on('MessageSent', (message: PrivateMessage) => {
      addPrivateMessage(message)
    })

    // 接收群聊消息
    signalRService.on('ReceiveGroupMessage', (message: GroupMessage) => {
      addGroupMessage(message)
    })

    // 用户正在输入
    signalRService.on('UserTyping', (userId: string, isTyping: boolean) => {
      setTypingStatus(userId, isTyping)
    })

    // 消息已读
    signalRService.on('MessageRead', (messageId: string, readAt: string) => {
      // 更新消息状态
      for (const [, messages] of privateMessages.value) {
        const message = messages.find((m) => m.id === messageId)
        if (message) {
          message.status = MessageStatus.Read
          message.readAt = readAt
          break
        }
      }
    })
  }

  function setCurrentUserId(userId: string) {
    currentUserId.value = userId
  }

  function setCurrentChatId(chatId: string | null) {
    currentChatId.value = chatId
  }

  // ==================== IndexedDB 同步和清理 ====================

  /**
   * 清空特定会话的消息（保留已读位置）
   * @param chatId 会话 ID（好友 ID 或群组 ID）
   * @param type 会话类型
   */
  async function clearConversationMessages(chatId: string, type: 'private' | 'group') {
    try {
      // 清空内存中的消息
      if (type === 'private') {
        privateMessages.value.delete(chatId)
      } else {
        groupMessages.value.delete(chatId)
      }

      // 清空 IndexedDB 中的消息（需要实现 messageStorage 的对应方法）
      // 注意：保留 lastReadMessageIds，这样下次进入时只会加载新消息

      console.log(`已清空 ${type === 'private' ? '私聊' : '群聊'} ${chatId} 的消息`)
    } catch (error) {
      console.error('清空会话消息失败:', error)
      throw error
    }
  }

  /**
   * 从 IndexedDB 同步消息到内存
   * 应用启动时调用,恢复上次的消息
   */
  async function syncMessagesFromDB() {
    try {
      // 可以选择性地恢复最近的会话消息
      // 或者等用户打开聊天时再加载 (当前策略)
      // 这里暂时不做任何操作,消息会在用户打开聊天时自动从 IndexedDB 加载
    } catch (error) {
      console.error('从 IndexedDB 同步消息失败:', error)
    }
  }

  /**
   * 清除本地缓存 (内存 + IndexedDB)
   */
  async function clearLocalCache() {
    try {
      // 清除 IndexedDB
      await messageStorage.clearAllMessages()

      // 清除内存
      privateMessages.value.clear()
      groupMessages.value.clear()
      conversations.value = []
      unreadCounts.value.clear()
      typingUsers.value.clear()
      lastReadMessageIds.value.clear()
    } catch (error) {
      console.error('清除缓存失败:', error)
      throw error
    }
  }

  /**
   * 清理旧消息
   * @param daysToKeep 保留天数 (默认 30 天)
   */
  async function cleanupOldMessages(daysToKeep = 30) {
    try {
      await messageStorage.deleteOldMessages(daysToKeep)
    } catch (error) {
      console.error('清理旧消息失败:', error)
      throw error
    }
  }

  /**
   * 获取存储统计信息
   */
  async function getStorageStats() {
    try {
      return await messageStorage.getStorageStats()
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return {
        privateMessageCount: 0,
        groupMessageCount: 0,
        conversationCount: 0
      }
    }
  }

  return {
    conversations,
    privateMessages,
    groupMessages,
    unreadCounts,
    typingUsers,
    currentUserId,
    currentChatId,
    totalUnreadCount,
    sortedConversations,
    loadConversations,
    loadPrivateMessages,
    loadOlderPrivateMessages,
    loadNewerPrivateMessages,
    loadGroupMessages,
    loadOlderGroupMessages,
    loadNewerGroupMessages,
    sendPrivateMessage,
    sendGroupMessage,
    markAsRead,
    markAllAsRead,
    addPrivateMessage,
    addGroupMessage,
    setTypingStatus,
    setupSignalRListeners,
    setCurrentUserId,
    setCurrentChatId,
    clearConversationMessages,
    syncMessagesFromDB,
    clearLocalCache,
    cleanupOldMessages,
    getStorageStats,
  }
})
