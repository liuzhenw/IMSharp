import { ref, computed, reactive } from 'vue'
import { defineStore } from 'pinia'
import { messagesApi, groupsApi } from '@/services'
import { signalRService } from '@/services'
import { messageStorage } from '@/services/messageStorage'
import type { PrivateMessage, GroupMessage, User } from '@/types'
import { MessageStatus } from '@/types'
import {
  createHistoryCursorState,
  getMessageBoundaries,
  mergeMessages,
  sortMessagesByCreatedAt,
} from '@/utils/messageHistory'

// 会话类型
interface Conversation {
  id: string // 好友 ID 或群组 ID
  type: 'private' | 'group'
  name: string
  avatar: string | null
  lastMessage: string | null
  lastMessageTime: string | null
  lastMessageType?: string // 最后一条消息的类型 (Text, Image, etc.)
  unreadCount: number
  isOnline?: boolean
  user?: User
}

export const useChatStore = defineStore('chat', () => {
  // State
  const conversations = ref<Conversation[]>([])
  const privateMessages = ref<Map<string, PrivateMessage[]>>(new Map())
  const groupMessages = ref<Map<string, GroupMessage[]>>(new Map())
  const unreadCounts = reactive<Record<string, number>>({})
  const typingUsers = ref<Map<string, boolean>>(new Map())
  const typingTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
  const currentUserId = ref<string | null>(null)
  const currentChatId = ref<string | null>(null) // 当前正在查看的聊天 ID

  // 已读位置管理 - 保存每个会话最后一条已读消息的 ID
  const lastReadMessageIds = ref<Map<string, string>>(new Map())
  const lastReadPositionsLoaded = ref(false)

  // 被删除的好友 ID - 用于通知 UI 层显示确认框
  const deletedFriendId = ref<string | null>(null)

  // 从 localStorage 加载未读消息数
  function loadUnreadCounts() {
    try {
      const stored = localStorage.getItem('unreadCounts')
      if (stored) {
        const parsed = JSON.parse(stored)
        Object.assign(unreadCounts, parsed)
      }
    } catch (error) {
      console.error('加载未读消息数失败:', error)
    }
  }

  // 保存未读消息数到 localStorage
  function saveUnreadCounts() {
    try {
      localStorage.setItem('unreadCounts', JSON.stringify(unreadCounts))
    } catch (error) {
      console.error('保存未读消息数失败:', error)
    }
  }

  // 会话最后消息信息的持久化
  const conversationLastMessages = ref<
    Map<
      string,
      {
        lastMessage: string
        lastMessageTime: string
        lastMessageType?: string
      }
    >
  >(new Map())

  // 从 localStorage 加载会话最后消息信息
  function loadConversationLastMessages() {
    try {
      const stored = localStorage.getItem('conversationLastMessages')
      if (stored) {
        const parsed = JSON.parse(stored)
        conversationLastMessages.value = new Map(Object.entries(parsed))
      }
    } catch (error) {
      console.error('加载会话最后消息信息失败:', error)
    }
  }

  // 保存会话最后消息信息到 localStorage
  function saveConversationLastMessages() {
    try {
      const obj = Object.fromEntries(conversationLastMessages.value)
      localStorage.setItem('conversationLastMessages', JSON.stringify(obj))
    } catch (error) {
      console.error('保存会话最后消息信息失败:', error)
    }
  }

  // 从 IndexedDB 加载所有已读位置
  async function loadLastReadPositions() {
    if (lastReadPositionsLoaded.value) return

    try {
      const positions = await messageStorage.getAllLastReadPositions()
      lastReadMessageIds.value = positions
      lastReadPositionsLoaded.value = true
    } catch (error) {
      console.error('加载已读位置失败:', error)
    }
  }

  // 确保已读位置已加载
  async function ensureLastReadPositionsLoaded() {
    if (!lastReadPositionsLoaded.value) {
      await loadLastReadPositions()
    }
  }

  // 保存已读位置到 IndexedDB
  async function saveLastReadPosition(conversationId: string, messageId: string) {
    try {
      lastReadMessageIds.value.set(conversationId, messageId)
      await messageStorage.saveLastReadPosition(conversationId, messageId)
    } catch (error) {
      console.error('保存已读位置失败:', error)
    }
  }

  // 游标状态管理
  const privateCursors = ref<
    Map<
      string,
      {
        nextCursor: string | null // 用于加载更早的历史消息
        prevCursor: string | null // 用于加载更新的消息
        hasMore: boolean // 是否还有更多历史消息
      }
    >
  >(new Map())

  const groupCursors = ref<
    Map<
      string,
      {
        nextCursor: string | null
        prevCursor: string | null
        hasMore: boolean
      }
    >
  >(new Map())

  // Getters
  const totalUnreadCount = computed(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  })

  const sortedConversations = computed(() => {
    return [...conversations.value]
      .map((c) => ({
        ...c,
        // 动态获取最新的未读数
        unreadCount: unreadCounts[c.id] || 0,
      }))
      .sort((a, b) => {
        // 1. 优先按未读数排序（有未读的在前）
        const hasUnreadA = a.unreadCount > 0 ? 1 : 0
        const hasUnreadB = b.unreadCount > 0 ? 1 : 0
        if (hasUnreadA !== hasUnreadB) {
          return hasUnreadB - hasUnreadA
        }

        // 2. 其次按最后消息时间排序
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
        return timeB - timeA
      })
  })

  // Actions
  async function loadConversations() {
    try {
      // 加载会话最后消息信息
      loadConversationLastMessages()

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

      // 加载已读位置
      await ensureLastReadPositionsLoaded()

      // 重新从 IndexedDB 计算未读数
      if (currentUserId.value) {
        const uid = currentUserId.value
        const counts: Record<string, number> = {}

        await Promise.all([
          ...contactsStore.friends.map(async (friend) => {
            const lastRead = lastReadMessageIds.value.get(friend.id)
            if (lastRead) {
              counts[friend.id] = await messageStorage.countPrivateUnreadMessages(
                friend.id,
                uid,
                lastRead,
              )
            }
          }),
          ...groupsStore.groups.map(async (group) => {
            const lastRead = lastReadMessageIds.value.get(group.id)
            if (lastRead) {
              counts[group.id] = await messageStorage.countGroupUnreadMessages(
                group.id,
                uid,
                lastRead,
              )
            }
          }),
        ])

        // 合并 IndexedDB 计算结果：取 IndexedDB 与当前内存值的较大者，避免覆盖 SignalR 增量
        for (const [key, count] of Object.entries(counts)) {
          unreadCounts[key] = Math.max(count, unreadCounts[key] || 0)
        }
        // 清理已不存在的会话（好友/群组已删除的）
        const validIds = new Set([
          ...contactsStore.friends.map((f) => f.id),
          ...groupsStore.groups.map((g) => g.id),
        ])
        Object.keys(unreadCounts).forEach((k) => {
          if (!validIds.has(k)) delete unreadCounts[k]
        })
        saveUnreadCounts()
      }

      // 从好友构建私聊会话
      const friendConversations: Conversation[] = contactsStore.friends.map((friend) => {
        let lastMsgInfo = conversationLastMessages.value.get(friend.id)
        // 兜底：从内存中的消息取最新一条
        if (!lastMsgInfo) {
          const msgs = privateMessages.value.get(friend.id)
          if (msgs && msgs.length > 0) {
            const latest = msgs[msgs.length - 1]!
            lastMsgInfo = {
              lastMessage: latest.content,
              lastMessageTime: latest.createdAt,
              lastMessageType: latest.type,
            }
          }
        }
        return {
          id: friend.id,
          type: 'private' as const,
          name: friend.displayName || friend.username,
          avatar: friend.avatar,
          lastMessage: lastMsgInfo?.lastMessage || null,
          lastMessageTime: lastMsgInfo?.lastMessageTime || null,
          lastMessageType: lastMsgInfo?.lastMessageType,
          unreadCount: unreadCounts[friend.id] || 0,
          isOnline: friend.isOnline,
          user: friend,
        }
      })

      // 从群组构建群聊会话
      const groupConversations: Conversation[] = groupsStore.groups.map((group) => {
        let lastMsgInfo = conversationLastMessages.value.get(group.id)
        // 兜底：从内存中的消息取最新一条
        if (!lastMsgInfo) {
          const msgs = groupMessages.value.get(group.id)
          if (msgs && msgs.length > 0) {
            const latest = msgs[msgs.length - 1]!
            lastMsgInfo = {
              lastMessage: latest.content,
              lastMessageTime: latest.createdAt,
              lastMessageType: latest.type,
            }
          }
        }
        return {
          id: group.id,
          type: 'group' as const,
          name: group.name,
          avatar: group.avatar,
          lastMessage: lastMsgInfo?.lastMessage || null,
          lastMessageTime: lastMsgInfo?.lastMessageTime || null,
          lastMessageType: lastMsgInfo?.lastMessageType,
          unreadCount: unreadCounts[group.id] || 0,
        }
      })

      conversations.value = [...friendConversations, ...groupConversations]
    } catch (error) {
      console.error('Load conversations failed:', error)
      throw error
    }
  }

  function canLoadOlderPrivateMessages(friendId: string) {
    const messages = privateMessages.value.get(friendId) || []
    if (messages.length === 0) {
      return false
    }

    const cursor = privateCursors.value.get(friendId)
    if (!cursor) {
      return true
    }

    return cursor.hasMore && Boolean(cursor.nextCursor)
  }

  function canLoadOlderGroupMessages(groupId: string) {
    const messages = groupMessages.value.get(groupId) || []
    if (messages.length === 0) {
      return false
    }

    const cursor = groupCursors.value.get(groupId)
    if (!cursor) {
      return true
    }

    return cursor.hasMore && Boolean(cursor.nextCursor)
  }

  async function hasLocalOlderPrivateMessages(friendId: string, beforeMessageId: string) {
    if (!currentUserId.value) {
      return false
    }

    return await messageStorage.hasPrivateMessagesBefore(
      friendId,
      currentUserId.value,
      beforeMessageId,
    )
  }

  async function hasLocalOlderGroupMessages(groupId: string, beforeMessageId: string) {
    return await messageStorage.hasGroupMessagesBefore(groupId, beforeMessageId)
  }

  async function loadPrivateMessages(friendId: string, options?: { limit?: number }) {
    try {
      const limit = options?.limit || 50

      // 0. 确保已读位置已加载
      await ensureLastReadPositionsLoaded()

      // 1. 先从 IndexedDB 加载缓存消息（快速显示）
      if (currentUserId.value) {
        const cachedMessages = await messageStorage.getPrivateMessages(
          friendId,
          currentUserId.value,
        )
        if (cachedMessages.length > 0) {
          privateMessages.value.set(friendId, sortMessagesByCreatedAt(cachedMessages))
        }
      }

      // 2. 获取最后已读消息 ID
      const lastReadMessageId = lastReadMessageIds.value.get(friendId)

      // 3. 如果有最后已读位置，只加载该位置之后的新消息
      if (lastReadMessageId) {
        const response = await messagesApi.getConversation(friendId, {
          after: lastReadMessageId,
          limit,
        })

        const existing = privateMessages.value.get(friendId) || []
        const merged = mergeMessages(existing, response.messages)
        if (merged.length === 0) {
          const latestResponse = await messagesApi.getConversation(friendId, { limit })
          const normalizedMessages = sortMessagesByCreatedAt(latestResponse.messages)
          privateMessages.value.set(friendId, normalizedMessages)
          privateCursors.value.set(
            friendId,
            createHistoryCursorState(normalizedMessages, {
              nextCursor: latestResponse.nextCursor,
              prevCursor: latestResponse.prevCursor,
              hasMore: latestResponse.hasMore,
            }),
          )

          if (latestResponse.messages.length > 0) {
            await messageStorage.savePrivateMessages(latestResponse.messages)

            const latestMessage = latestResponse.messages[0]
            if (latestMessage) {
              await saveLastReadPosition(friendId, latestMessage.id)
              conversationLastMessages.value.set(friendId, {
                lastMessage: latestMessage.content,
                lastMessageTime: latestMessage.createdAt,
                lastMessageType: latestMessage.type,
              })
              saveConversationLastMessages()
            }
          }

          return latestResponse
        }

        if (merged.length > 0) {
          privateMessages.value.set(friendId, merged)
          const existingCursor = privateCursors.value.get(friendId)
          const { oldest, newest } = getMessageBoundaries(merged)
          const hasLocalOlder = oldest
            ? await hasLocalOlderPrivateMessages(friendId, oldest.id)
            : false

          privateCursors.value.set(
            friendId,
            createHistoryCursorState(merged, {
              nextCursor: existingCursor?.nextCursor ?? oldest?.id ?? null,
              prevCursor: response.prevCursor ?? newest?.id ?? null,
              hasMore: response.hasMore || hasLocalOlder,
            }),
          )
        }

        // 如果有新消息，合并到现有消息列表
        if (response.messages.length > 0) {
          // 保存到 IndexedDB
          await messageStorage.savePrivateMessages(response.messages)

          // 更新最新消息的 ID 作为已读位置
          const latestMessage = response.messages[0]
          if (latestMessage) {
            await saveLastReadPosition(friendId, latestMessage.id)
          }

          // 更新会话最后消息信息（用于会话列表预览）
          const newest = response.messages[0]
          if (newest) {
            conversationLastMessages.value.set(friendId, {
              lastMessage: newest.content,
              lastMessageTime: newest.createdAt,
              lastMessageType: newest.type,
            })
            saveConversationLastMessages()
          }
        }

        return response
      }

      // 4. 首次加载：从 API 加载最新消息（不提供 before/after）
      const response = await messagesApi.getConversation(friendId, {
        limit,
      })
      const normalizedMessages = sortMessagesByCreatedAt(response.messages)
      const { oldest } = getMessageBoundaries(normalizedMessages)
      const hasLocalOlder = oldest ? await hasLocalOlderPrivateMessages(friendId, oldest.id) : false

      // 5. 更新消息列表（覆盖缓存）
      privateMessages.value.set(friendId, normalizedMessages)

      // 6. 更新游标状态
      privateCursors.value.set(
        friendId,
        createHistoryCursorState(normalizedMessages, {
          nextCursor: response.nextCursor,
          prevCursor: response.prevCursor,
          hasMore: response.hasMore || hasLocalOlder,
        }),
      )

      // 7. 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.savePrivateMessages(response.messages)

        // 8. 保存最新消息的 ID 作为已读位置（消息列表倒序，第一个是最新的）
        const latestMessage = response.messages[0]
        if (latestMessage) {
          await saveLastReadPosition(friendId, latestMessage.id)

          // 更新会话最后消息信息（用于会话列表预览）
          conversationLastMessages.value.set(friendId, {
            lastMessage: latestMessage.content,
            lastMessageTime: latestMessage.createdAt,
            lastMessageType: latestMessage.type,
          })
          saveConversationLastMessages()
        }
      }

      return response
    } catch (error) {
      console.error('Load private messages failed:', error)
      throw error
    }
  }

  // 加载更早的历史消息（向上滚动）
  async function loadOlderPrivateMessages(friendId: string, options?: { limit?: number }) {
    try {
      const limit = options?.limit || 50
      const existing = privateMessages.value.get(friendId) || []
      const { oldest, newest } = getMessageBoundaries(existing)
      if (!oldest) {
        return { messages: [], hasMore: false, nextCursor: null, prevCursor: null }
      }

      if (currentUserId.value) {
        const localOlderMessages = await messageStorage.getPrivateMessagesBefore(
          friendId,
          currentUserId.value,
          oldest.id,
          limit,
        )

        if (localOlderMessages.length > 0) {
          const merged = mergeMessages(existing, localOlderMessages)
          privateMessages.value.set(friendId, merged)

          const cursor = privateCursors.value.get(friendId)
          const localNextCursor = getMessageBoundaries(localOlderMessages).oldest?.id ?? oldest.id
          const hasMoreLocal = await hasLocalOlderPrivateMessages(friendId, localNextCursor)
          privateCursors.value.set(
            friendId,
            createHistoryCursorState(merged, {
              nextCursor: localNextCursor,
              prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
              hasMore: hasMoreLocal || Boolean(cursor?.hasMore),
            }),
          )

          return {
            messages: localOlderMessages,
            hasMore: hasMoreLocal || Boolean(cursor?.hasMore),
            nextCursor: localNextCursor,
            prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
          }
        }
      }

      const cursor = privateCursors.value.get(friendId)
      const beforeCursor = cursor?.nextCursor ?? oldest.id
      if (!beforeCursor || (cursor && !cursor.hasMore)) {
        return {
          messages: [],
          hasMore: false,
          nextCursor: null,
          prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
        }
      }

      // 使用 nextCursor 加载更早的消息
      const response = await messagesApi.getConversation(friendId, {
        before: beforeCursor,
        limit,
      })

      // 合并消息（去重）
      const merged = mergeMessages(existing, response.messages)
      privateMessages.value.set(friendId, merged)
      const mergedOldest = getMessageBoundaries(merged).oldest
      const hasLocalOlder = mergedOldest
        ? await hasLocalOlderPrivateMessages(friendId, mergedOldest.id)
        : false

      // 更新游标状态
      privateCursors.value.set(
        friendId,
        createHistoryCursorState(merged, {
          nextCursor: response.nextCursor,
          prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
          hasMore: response.hasMore || hasLocalOlder,
        }),
      )

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
  async function loadNewerPrivateMessages(friendId: string, options?: { limit?: number }) {
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

  async function loadGroupMessages(groupId: string, options?: { limit?: number }) {
    try {
      const limit = options?.limit || 50

      // 0. 确保已读位置已加载
      await ensureLastReadPositionsLoaded()

      // 1. 先从 IndexedDB 加载缓存消息（快速显示）
      const cachedMessages = await messageStorage.getGroupMessages(groupId)
      if (cachedMessages.length > 0) {
        groupMessages.value.set(groupId, sortMessagesByCreatedAt(cachedMessages))
      }

      // 2. 获取最后已读消息 ID
      const lastReadMessageId = lastReadMessageIds.value.get(groupId)

      // 3. 如果有最后已读位置，只加载该位置之后的新消息
      if (lastReadMessageId) {
        const response = await groupsApi.getMessages(groupId, {
          after: lastReadMessageId,
          limit,
        })

        const existing = groupMessages.value.get(groupId) || []
        const merged = mergeMessages(existing, response.messages)
        if (merged.length === 0) {
          const latestResponse = await groupsApi.getMessages(groupId, { limit })
          const normalizedMessages = sortMessagesByCreatedAt(latestResponse.messages)
          groupMessages.value.set(groupId, normalizedMessages)
          groupCursors.value.set(
            groupId,
            createHistoryCursorState(normalizedMessages, {
              nextCursor: latestResponse.nextCursor,
              prevCursor: latestResponse.prevCursor,
              hasMore: latestResponse.hasMore,
            }),
          )

          if (latestResponse.messages.length > 0) {
            await messageStorage.saveGroupMessages(latestResponse.messages)

            const latestMessage = latestResponse.messages[0]
            if (latestMessage) {
              await saveLastReadPosition(groupId, latestMessage.id)
              conversationLastMessages.value.set(groupId, {
                lastMessage: latestMessage.content,
                lastMessageTime: latestMessage.createdAt,
                lastMessageType: latestMessage.type,
              })
              saveConversationLastMessages()
            }
          }

          return latestResponse
        }

        if (merged.length > 0) {
          groupMessages.value.set(groupId, merged)
          const existingCursor = groupCursors.value.get(groupId)
          const { oldest, newest } = getMessageBoundaries(merged)
          const hasLocalOlder = oldest
            ? await hasLocalOlderGroupMessages(groupId, oldest.id)
            : false

          groupCursors.value.set(
            groupId,
            createHistoryCursorState(merged, {
              nextCursor: existingCursor?.nextCursor ?? oldest?.id ?? null,
              prevCursor: response.prevCursor ?? newest?.id ?? null,
              hasMore: response.hasMore || hasLocalOlder,
            }),
          )
        }

        // 如果有新消息，合并到现有消息列表
        if (response.messages.length > 0) {
          // 保存到 IndexedDB
          await messageStorage.saveGroupMessages(response.messages)

          // 更新最新消息的 ID 作为已读位置
          const latestMessage = response.messages[0]
          if (latestMessage) {
            await saveLastReadPosition(groupId, latestMessage.id)
          }

          // 更新会话最后消息信息（用于会话列表预览）
          const newest = response.messages[0]
          if (newest) {
            conversationLastMessages.value.set(groupId, {
              lastMessage: newest.content,
              lastMessageTime: newest.createdAt,
              lastMessageType: newest.type,
            })
            saveConversationLastMessages()
          }
        }

        return response
      }

      // 4. 首次加载：从 API 加载最新消息（不提供 before/after）
      const response = await groupsApi.getMessages(groupId, {
        limit,
      })
      const normalizedMessages = sortMessagesByCreatedAt(response.messages)
      const { oldest } = getMessageBoundaries(normalizedMessages)
      const hasLocalOlder = oldest ? await hasLocalOlderGroupMessages(groupId, oldest.id) : false

      // 5. 更新消息列表（覆盖缓存）
      groupMessages.value.set(groupId, normalizedMessages)

      // 6. 更新游标状态
      groupCursors.value.set(
        groupId,
        createHistoryCursorState(normalizedMessages, {
          nextCursor: response.nextCursor,
          prevCursor: response.prevCursor,
          hasMore: response.hasMore || hasLocalOlder,
        }),
      )

      // 7. 保存到 IndexedDB
      if (response.messages.length > 0) {
        await messageStorage.saveGroupMessages(response.messages)

        // 8. 保存最新消息的 ID 作为已读位置（消息列表倒序，第一个是最新的）
        const latestMessage = response.messages[0]
        if (latestMessage) {
          await saveLastReadPosition(groupId, latestMessage.id)

          // 更新会话最后消息信息（用于会话列表预览）
          conversationLastMessages.value.set(groupId, {
            lastMessage: latestMessage.content,
            lastMessageTime: latestMessage.createdAt,
            lastMessageType: latestMessage.type,
          })
          saveConversationLastMessages()
        }
      }

      return response
    } catch (error) {
      console.error('Load group messages failed:', error)
      throw error
    }
  }

  // 加载更早的群聊历史消息（向上滚动）
  async function loadOlderGroupMessages(groupId: string, options?: { limit?: number }) {
    try {
      const limit = options?.limit || 50
      const existing = groupMessages.value.get(groupId) || []
      const { oldest, newest } = getMessageBoundaries(existing)
      if (!oldest) {
        return { messages: [], hasMore: false, nextCursor: null, prevCursor: null }
      }

      const localOlderMessages = await messageStorage.getGroupMessagesBefore(
        groupId,
        oldest.id,
        limit,
      )

      if (localOlderMessages.length > 0) {
        const merged = mergeMessages(existing, localOlderMessages)
        groupMessages.value.set(groupId, merged)

        const cursor = groupCursors.value.get(groupId)
        const localNextCursor = getMessageBoundaries(localOlderMessages).oldest?.id ?? oldest.id
        const hasMoreLocal = await hasLocalOlderGroupMessages(groupId, localNextCursor)
        groupCursors.value.set(
          groupId,
          createHistoryCursorState(merged, {
            nextCursor: localNextCursor,
            prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
            hasMore: hasMoreLocal || Boolean(cursor?.hasMore),
          }),
        )

        return {
          messages: localOlderMessages,
          hasMore: hasMoreLocal || Boolean(cursor?.hasMore),
          nextCursor: localNextCursor,
          prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
        }
      }

      const cursor = groupCursors.value.get(groupId)
      const beforeCursor = cursor?.nextCursor ?? oldest.id
      if (!beforeCursor || (cursor && !cursor.hasMore)) {
        return {
          messages: [],
          hasMore: false,
          nextCursor: null,
          prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
        }
      }

      // 使用 nextCursor 加载更早的消息
      const response = await groupsApi.getMessages(groupId, {
        before: beforeCursor,
        limit,
      })

      // 合并消息（去重）
      const merged = mergeMessages(existing, response.messages)
      groupMessages.value.set(groupId, merged)
      const mergedOldest = getMessageBoundaries(merged).oldest
      const hasLocalOlder = mergedOldest
        ? await hasLocalOlderGroupMessages(groupId, mergedOldest.id)
        : false

      // 更新游标状态
      groupCursors.value.set(
        groupId,
        createHistoryCursorState(merged, {
          nextCursor: response.nextCursor,
          prevCursor: cursor?.prevCursor ?? newest?.id ?? null,
          hasMore: response.hasMore || hasLocalOlder,
        }),
      )

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
  async function loadNewerGroupMessages(groupId: string, options?: { limit?: number }) {
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

  function clearUnreadCount(chatId: string) {
    unreadCounts[chatId] = 0
    saveUnreadCounts()

    // 同步已读位置到该会话最新消息，防止刷新后重新计算出未读数
    const privateList = privateMessages.value.get(chatId)
    const groupList = groupMessages.value.get(chatId)
    const list = privateList || groupList
    if (list && list.length > 0) {
      const latest = list[list.length - 1]!
      saveLastReadPosition(chatId, latest.id).catch((err) => {
        console.error('更新已读位置失败:', err)
      })
    } else {
      // 消息未加载到内存，从 IndexedDB 查最新消息
      messageStorage.getLastMessage(chatId).then((msg) => {
        if (msg) {
          saveLastReadPosition(chatId, msg.id).catch((err) => {
            console.error('更新已读位置失败:', err)
          })
        }
      })
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
      try {
        await signalRService.markAllAsRead(friendId)
      } catch (signalRError) {
        console.warn('SignalR 标记全部已读失败，回退到 HTTP:', signalRError)
        await messagesApi.markAllAsRead(friendId)
      }
      unreadCounts[friendId] = 0
      saveUnreadCounts()

      // 同步已读位置到最新消息
      const list = privateMessages.value.get(friendId)
      if (list && list.length > 0) {
        const latest = list[list.length - 1]!
        await saveLastReadPosition(friendId, latest.id)
      }
    } catch (error) {
      console.error('Mark all as read failed:', error)
      throw error
    }
  }

  function updatePrivateMessageStatus(
    predicate: (message: PrivateMessage) => boolean,
    updater: (message: PrivateMessage) => void,
  ) {
    for (const [, messages] of privateMessages.value) {
      for (const message of messages) {
        if (!predicate(message)) {
          continue
        }

        updater(message)
        messageStorage.savePrivateMessage(message).catch((err) => {
          console.error('更新私聊消息状态失败:', err)
        })
      }
    }
  }

  function markConversationMessagesAsRead(friendId: string, readAt: string) {
    updatePrivateMessageStatus(
      (message) =>
        message.senderId === currentUserId.value &&
        message.receiverId === friendId &&
        message.status !== MessageStatus.Read,
      (message) => {
        message.status = MessageStatus.Read
        message.readAt = readAt
      },
    )
  }

  async function addPrivateMessage(message: PrivateMessage) {
    // 确定会话 ID (对方的 ID)
    const conversationId =
      message.senderId === currentUserId.value ? message.receiverId : message.senderId

    if (!privateMessages.value.has(conversationId)) {
      privateMessages.value.set(conversationId, [])
    }

    const messages = privateMessages.value.get(conversationId)
    if (messages) {
      // 按 ID 去重，避免 MessageSent 回显和 ReceiveMessage 重复
      if (messages.some((m) => m.id === message.id)) return
      messages.push(message)
    }

    // 只有在当前查看该聊天时才更新已读位置
    if (conversationId === currentChatId.value) {
      saveLastReadPosition(conversationId, message.id).catch((err) => {
        console.error('保存已读位置失败:', err)
      })
    }

    // 保存到 IndexedDB (异步,不阻塞 UI)
    messageStorage.savePrivateMessage(message).catch((err) => {
      console.error('保存消息到 IndexedDB 失败:', err)
    })

    // 先确保会话条目存在（可能需要 await loadFriends），再递增未读数
    await updateConversation(
      conversationId,
      'private',
      message.content,
      message.createdAt,
      message.type,
    )

    // 只有接收到的消息才增加未读数,且不在当前查看的聊天中
    if (message.receiverId === currentUserId.value && conversationId !== currentChatId.value) {
      const currentUnread = unreadCounts[conversationId] || 0
      unreadCounts[conversationId] = currentUnread + 1
      saveUnreadCounts()
    }
  }

  function addGroupMessage(message: GroupMessage) {
    if (!groupMessages.value.has(message.groupId)) {
      groupMessages.value.set(message.groupId, [])
    }

    const messages = groupMessages.value.get(message.groupId)
    if (messages) {
      if (messages.some((m) => m.id === message.id)) return
      messages.push(message)
    }

    // 只有在当前查看该群聊时才更新已读位置
    if (message.groupId === currentChatId.value) {
      saveLastReadPosition(message.groupId, message.id).catch((err) => {
        console.error('保存已读位置失败:', err)
      })
    }

    // 保存到 IndexedDB (异步,不阻塞 UI)
    messageStorage.saveGroupMessage(message).catch((err) => {
      console.error('保存群聊消息到 IndexedDB 失败:', err)
    })

    // 更新会话列表
    updateConversation(message.groupId, 'group', message.content, message.createdAt, message.type)

    // 只有不在当前查看的群聊中时才增加未读数
    if (message.groupId !== currentChatId.value) {
      const currentUnread = unreadCounts[message.groupId] || 0
      unreadCounts[message.groupId] = currentUnread + 1
      saveUnreadCounts()
    }
  }

  async function updateConversation(
    id: string,
    type: 'private' | 'group',
    lastMessage: string,
    lastMessageTime: string,
    lastMessageType?: string,
  ) {
    const index = conversations.value.findIndex((c) => c.id === id)

    if (index >= 0) {
      const conversation = conversations.value[index]
      if (conversation) {
        conversation.lastMessage = lastMessage
        conversation.lastMessageTime = lastMessageTime
        conversation.lastMessageType = lastMessageType
        conversation.unreadCount = unreadCounts[id] || 0
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
        let friend = contactsStore.friends.find((f: User) => f.id === id)
        if (!friend) {
          // 好友列表可能还未加载完，主动刷新一次
          await contactsStore.loadFriends()
          friend = contactsStore.friends.find((f: User) => f.id === id)
        }
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
        lastMessageType,
        unreadCount: unreadCounts[id] || 0,
        isOnline,
        user,
      })
    }

    // 保存会话最后消息信息到 localStorage
    conversationLastMessages.value.set(id, {
      lastMessage,
      lastMessageTime,
      lastMessageType,
    })
    saveConversationLastMessages()
  }

  function setTypingStatus(userId: string, isTyping: boolean) {
    const existingTimeout = typingTimeouts.get(userId)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      typingTimeouts.delete(userId)
    }

    typingUsers.value.set(userId, isTyping)

    // 3 秒后自动清除正在输入状态
    if (isTyping) {
      const timeoutId = setTimeout(() => {
        typingUsers.value.set(userId, false)
        typingTimeouts.delete(userId)
      }, 3000)
      typingTimeouts.set(userId, timeoutId)
    }
  }

  /**
   * 处理好友被删除事件
   * @param friendId 被删除的好友 ID
   */
  async function handleFriendDeleted(friendId: string) {
    try {
      console.log('[FriendDeleted] 收到好友删除事件:', {
        friendId,
        currentUserId: currentUserId.value,
        currentChatId: currentChatId.value,
        isCurrentChat: currentChatId.value === friendId,
      })

      // 1. 删除内存中的私聊消息
      privateMessages.value.delete(friendId)
      console.log('[FriendDeleted] 已删除内存中的消息')

      // 2. 删除 IndexedDB 中的私聊消息
      if (currentUserId.value) {
        await messageStorage.deletePrivateMessages(friendId, currentUserId.value)
        console.log('[FriendDeleted] 已删除 IndexedDB 中的消息')
      } else {
        console.warn('[FriendDeleted] currentUserId 为空，无法删除 IndexedDB 消息')
      }

      // 3. 删除已读位置
      lastReadMessageIds.value.delete(friendId)
      await messageStorage.deleteLastReadPosition(friendId)
      console.log('[FriendDeleted] 已删除已读位置')

      // 4. 从会话列表中移除该好友
      conversations.value = conversations.value.filter((c) => c.id !== friendId)
      console.log('[FriendDeleted] 已从会话列表移除')

      // 5. 清除未读计数
      delete unreadCounts[friendId]
      saveUnreadCounts()

      // 5.5. 清除会话最后消息信息
      conversationLastMessages.value.delete(friendId)
      saveConversationLastMessages()

      // 6. 清除游标状态
      privateCursors.value.delete(friendId)

      // 7. 设置 deletedFriendId 以通知 UI 层（如果当前正在查看该好友的聊天）
      if (currentChatId.value === friendId) {
        deletedFriendId.value = friendId
        console.log('[FriendDeleted] 设置 deletedFriendId，将显示提示框')
      } else {
        console.log('[FriendDeleted] 不是当前聊天，不显示提示框')
      }

      console.log(`[FriendDeleted] 已删除好友 ${friendId} 的所有本地数据`)
    } catch (error) {
      console.error('[FriendDeleted] 处理好友删除失败:', error)
      throw error
    }
  }

  /**
   * 清除被删除好友的通知状态
   */
  function clearDeletedFriendNotification() {
    deletedFriendId.value = null
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

    // 消息已送达
    signalRService.on('MessageDelivered', (messageId: string, deliveredAt: string) => {
      updatePrivateMessageStatus(
        (message) => message.id === messageId && message.status === MessageStatus.Sent,
        (message) => {
          message.status = MessageStatus.Delivered
          message.deliveredAt = deliveredAt
        },
      )
    })

    // 消息已读
    signalRService.on('MessageRead', (messageId: string, readAt: string) => {
      updatePrivateMessageStatus(
        (message) => message.id === messageId,
        (message) => {
          message.status = MessageStatus.Read
          message.readAt = readAt
        },
      )
    })

    // 会话内全部消息已读
    signalRService.on('AllMessagesRead', (userId: string) => {
      markConversationMessagesAsRead(userId, new Date().toISOString())
    })

    // 好友关系被删除
    signalRService.on('FriendDeleted', async (data: { userId: string }) => {
      console.log('[SignalR] 收到 FriendDeleted 事件:', data)
      await handleFriendDeleted(data.userId)
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
      Object.keys(unreadCounts).forEach((key) => delete unreadCounts[key])
      typingUsers.value.clear()
      lastReadMessageIds.value.clear()
      conversationLastMessages.value.clear()

      // 清除 localStorage 中的未读数和会话最后消息信息
      saveUnreadCounts()
      saveConversationLastMessages()
    } catch (error) {
      console.error('清除缓存失败:', error)
      throw error
    }
  }

  /**
   * 清理旧消息
   * @param daysToKeep 保留天数 (默认 7 天)
   */
  async function cleanupOldMessages(daysToKeep = 7) {
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
        conversationCount: 0,
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
    deletedFriendId,
    totalUnreadCount,
    sortedConversations,
    loadConversations,
    loadPrivateMessages,
    loadOlderPrivateMessages,
    loadNewerPrivateMessages,
    canLoadOlderPrivateMessages,
    loadGroupMessages,
    loadOlderGroupMessages,
    loadNewerGroupMessages,
    canLoadOlderGroupMessages,
    sendPrivateMessage,
    sendGroupMessage,
    clearUnreadCount,
    markAsRead,
    markAllAsRead,
    addPrivateMessage,
    addGroupMessage,
    setTypingStatus,
    handleFriendDeleted,
    clearDeletedFriendNotification,
    setupSignalRListeners,
    setCurrentUserId,
    setCurrentChatId,
    loadLastReadPositions,
    saveLastReadPosition,
    clearConversationMessages,
    syncMessagesFromDB,
    clearLocalCache,
    cleanupOldMessages,
    getStorageStats,
  }
})
