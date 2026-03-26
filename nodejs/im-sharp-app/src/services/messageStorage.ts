import { db } from './db'
import type { PrivateMessage, GroupMessage } from '@/types'
import type { LastReadPosition } from './db'

const MAX_PRIVATE_MESSAGES = 5000
const MAX_GROUP_MESSAGES = 5000

async function getProtectedMessageIds(): Promise<Set<string>> {
  const positions = await db.lastReadPositions.toArray()
  return new Set(positions.map((position) => position.lastReadMessageId))
}

async function pruneMessagesIfNeeded(
  table: typeof db.privateMessages | typeof db.groupMessages,
  maxCount: number,
): Promise<void> {
  const total = await table.count()
  if (total <= maxCount) {
    return
  }

  const protectedIds = await getProtectedMessageIds()
  const allIds = (await table.orderBy('createdAt').primaryKeys()) as string[]
  const idsToDelete: string[] = []

  for (const id of allIds) {
    if (protectedIds.has(id)) {
      continue
    }

    idsToDelete.push(id)
    if (idsToDelete.length >= total - maxCount) {
      break
    }
  }

  if (idsToDelete.length > 0) {
    await table.bulkDelete(idsToDelete)
  }
}

/**
 * IndexedDB 消息存储服务
 * 提供消息的本地持久化存储功能
 */
export const messageStorage = {
  // ==================== 私聊消息操作 ====================

  /**
   * 保存单条私聊消息
   */
  async savePrivateMessage(message: PrivateMessage): Promise<void> {
    try {
      await db.privateMessages.put(message)
      await pruneMessagesIfNeeded(db.privateMessages, MAX_PRIVATE_MESSAGES)
    } catch (error) {
      console.error('保存私聊消息失败:', error)
      throw error
    }
  },

  /**
   * 获取私聊消息列表
   * @param userId 对方用户 ID
   * @param currentUserId 当前用户 ID
   * @param limit 限制数量 (默认 50)
   */
  async getPrivateMessages(
    userId: string,
    currentUserId: string,
    limit = 50,
  ): Promise<PrivateMessage[]> {
    try {
      // 查询双向消息 (我发给对方 + 对方发给我)
      const messages = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([userId, currentUserId])
        .or('[senderId+receiverId]')
        .equals([currentUserId, userId])
        .sortBy('createdAt')

      // 返回最新的 limit 条消息
      return messages.slice(-limit)
    } catch (error) {
      console.error('获取私聊消息失败:', error)
      return []
    }
  },

  /**
   * 批量保存私聊消息
   */
  async savePrivateMessages(messages: PrivateMessage[]): Promise<void> {
    try {
      await db.privateMessages.bulkPut(messages)
      await pruneMessagesIfNeeded(db.privateMessages, MAX_PRIVATE_MESSAGES)
    } catch (error) {
      console.error('批量保存私聊消息失败:', error)
      throw error
    }
  },

  /**
   * 获取指定消息之前的私聊历史
   */
  async getPrivateMessagesBefore(
    userId: string,
    currentUserId: string,
    beforeMessageId: string,
    limit = 50,
  ): Promise<PrivateMessage[]> {
    try {
      const messages = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([userId, currentUserId])
        .or('[senderId+receiverId]')
        .equals([currentUserId, userId])
        .sortBy('createdAt')

      const beforeIndex = messages.findIndex((message) => message.id === beforeMessageId)
      if (beforeIndex <= 0) {
        return []
      }

      return messages.slice(Math.max(0, beforeIndex - limit), beforeIndex)
    } catch (error) {
      console.error('获取更早私聊消息失败:', error)
      return []
    }
  },

  /**
   * 判断指定消息之前是否还有更早的私聊历史
   */
  async hasPrivateMessagesBefore(
    userId: string,
    currentUserId: string,
    beforeMessageId: string,
  ): Promise<boolean> {
    try {
      const messages = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([userId, currentUserId])
        .or('[senderId+receiverId]')
        .equals([currentUserId, userId])
        .sortBy('createdAt')

      const beforeIndex = messages.findIndex((message) => message.id === beforeMessageId)
      return beforeIndex > 0
    } catch (error) {
      console.error('判断更早私聊消息失败:', error)
      return false
    }
  },

  /**
   * 删除与指定用户的所有私聊消息
   * @param userId 对方用户 ID
   * @param currentUserId 当前用户 ID
   */
  async deletePrivateMessages(userId: string, currentUserId: string): Promise<void> {
    try {
      console.log('[MessageStorage] 开始删除私聊消息:', { userId, currentUserId })

      // 删除双向消息 (我发给对方 + 对方发给我)
      const deleted1 = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([userId, currentUserId])
        .delete()

      const deleted2 = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([currentUserId, userId])
        .delete()

      console.log('[MessageStorage] 删除私聊消息完成:', {
        userId,
        currentUserId,
        deleted1,
        deleted2,
        total: deleted1 + deleted2,
      })
    } catch (error) {
      console.error('删除私聊消息失败:', error)
      throw error
    }
  },

  // ==================== 群聊消息操作 ====================

  /**
   * 保存单条群聊消息
   */
  async saveGroupMessage(message: GroupMessage): Promise<void> {
    try {
      await db.groupMessages.put(message)
      await pruneMessagesIfNeeded(db.groupMessages, MAX_GROUP_MESSAGES)
    } catch (error) {
      console.error('保存群聊消息失败:', error)
      throw error
    }
  },

  /**
   * 获取群聊消息列表
   * @param groupId 群组 ID
   * @param limit 限制数量 (默认 50)
   */
  async getGroupMessages(groupId: string, limit = 50): Promise<GroupMessage[]> {
    try {
      const messages = await db.groupMessages.where('groupId').equals(groupId).sortBy('createdAt')

      // 返回最新的 limit 条消息
      return messages.slice(-limit)
    } catch (error) {
      console.error('获取群聊消息失败:', error)
      return []
    }
  },

  /**
   * 批量保存群聊消息
   */
  async saveGroupMessages(messages: GroupMessage[]): Promise<void> {
    try {
      await db.groupMessages.bulkPut(messages)
      await pruneMessagesIfNeeded(db.groupMessages, MAX_GROUP_MESSAGES)
    } catch (error) {
      console.error('批量保存群聊消息失败:', error)
      throw error
    }
  },

  /**
   * 获取指定消息之前的群聊历史
   */
  async getGroupMessagesBefore(
    groupId: string,
    beforeMessageId: string,
    limit = 50,
  ): Promise<GroupMessage[]> {
    try {
      const messages = await db.groupMessages.where('groupId').equals(groupId).sortBy('createdAt')

      const beforeIndex = messages.findIndex((message) => message.id === beforeMessageId)
      if (beforeIndex <= 0) {
        return []
      }

      return messages.slice(Math.max(0, beforeIndex - limit), beforeIndex)
    } catch (error) {
      console.error('获取更早群聊消息失败:', error)
      return []
    }
  },

  /**
   * 判断指定消息之前是否还有更早的群聊历史
   */
  async hasGroupMessagesBefore(groupId: string, beforeMessageId: string): Promise<boolean> {
    try {
      const messages = await db.groupMessages.where('groupId').equals(groupId).sortBy('createdAt')

      const beforeIndex = messages.findIndex((message) => message.id === beforeMessageId)
      return beforeIndex > 0
    } catch (error) {
      console.error('判断更早群聊消息失败:', error)
      return false
    }
  },

  // ==================== 清理操作 ====================

  /**
   * 清空所有消息和会话
   */
  async clearAllMessages(): Promise<void> {
    try {
      await db.privateMessages.clear()
      await db.groupMessages.clear()
      await db.conversations.clear()
    } catch (error) {
      console.error('清空消息失败:', error)
      throw error
    }
  },

  /**
   * 删除过期消息
   * @param daysToKeep 保留天数 (默认 30 天)
   */
  async deleteOldMessages(daysToKeep = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
      const cutoffTime = cutoffDate.toISOString()

      // 删除私聊消息
      await db.privateMessages.where('createdAt').below(cutoffTime).delete()

      // 删除群聊消息
      await db.groupMessages.where('createdAt').below(cutoffTime).delete()
    } catch (error) {
      console.error('删除过期消息失败:', error)
      throw error
    }
  },

  // ==================== 统计信息 ====================

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<{
    privateMessageCount: number
    groupMessageCount: number
    conversationCount: number
  }> {
    try {
      const [privateMessageCount, groupMessageCount, conversationCount] = await Promise.all([
        db.privateMessages.count(),
        db.groupMessages.count(),
        db.conversations.count(),
      ])

      return {
        privateMessageCount,
        groupMessageCount,
        conversationCount,
      }
    } catch (error) {
      console.error('获取存储统计失败:', error)
      return {
        privateMessageCount: 0,
        groupMessageCount: 0,
        conversationCount: 0,
      }
    }
  },

  // ==================== 已读位置操作 ====================

  /**
   * 保存已读位置
   * @param conversationId 会话 ID
   * @param lastReadMessageId 最后已读消息 ID
   */
  async saveLastReadPosition(conversationId: string, lastReadMessageId: string): Promise<void> {
    try {
      const position: LastReadPosition = {
        conversationId,
        lastReadMessageId,
        updatedAt: new Date().toISOString(),
      }
      await db.lastReadPositions.put(position)
    } catch (error) {
      console.error('保存已读位置失败:', error)
      throw error
    }
  },

  /**
   * 获取已读位置
   * @param conversationId 会话 ID
   * @returns 最后已读消息 ID，如果不存在返回 null
   */
  async getLastReadPosition(conversationId: string): Promise<string | null> {
    try {
      const position = await db.lastReadPositions.get(conversationId)
      return position?.lastReadMessageId || null
    } catch (error) {
      console.error('获取已读位置失败:', error)
      return null
    }
  },

  /**
   * 获取所有已读位置
   * @returns Map<conversationId, lastReadMessageId>
   */
  async getAllLastReadPositions(): Promise<Map<string, string>> {
    try {
      const positions = await db.lastReadPositions.toArray()
      return new Map(positions.map((p) => [p.conversationId, p.lastReadMessageId]))
    } catch (error) {
      console.error('获取所有已读位置失败:', error)
      return new Map()
    }
  },

  /**
   * 获取会话最新一条消息（私聊或群聊）
   */
  async getLastMessage(conversationId: string): Promise<{ id: string } | null> {
    try {
      // 先尝试群聊
      const groupMsg = await db.groupMessages.where('groupId').equals(conversationId).last()
      if (groupMsg) return groupMsg

      // 再尝试私聊（双向）
      const sent = await db.privateMessages
        .where('[senderId+receiverId]')
        .between([conversationId, ''], [conversationId, '\uffff'])
        .last()
      const received = await db.privateMessages
        .where('[senderId+receiverId]')
        .between(['', conversationId], ['\uffff', conversationId])
        .last()

      if (sent && received) {
        return sent.createdAt > received.createdAt ? sent : received
      }
      return sent || received || null
    } catch (error) {
      console.error('获取最新消息失败:', error)
      return null
    }
  },

  /**
   * 删除已读位置
   * @param conversationId 会话 ID
   */
  async deleteLastReadPosition(conversationId: string): Promise<void> {
    try {
      await db.lastReadPositions.delete(conversationId)
    } catch (error) {
      console.error('删除已读位置失败:', error)
      throw error
    }
  },

  /**
   * 计算私聊未读消息数（lastReadMessageId 之后收到的消息）
   */
  async countPrivateUnreadMessages(
    friendId: string,
    currentUserId: string,
    lastReadMessageId: string,
  ): Promise<number> {
    try {
      // 查对方发给我的消息（未读候选）
      const received = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([friendId, currentUserId])
        .sortBy('createdAt')

      // 查所有双向消息，用于定位 lastReadMessageId 的时间戳
      const allMessages = await db.privateMessages
        .where('[senderId+receiverId]')
        .anyOf([
          [friendId, currentUserId],
          [currentUserId, friendId],
        ])
        .sortBy('createdAt')

      const lastRead = allMessages.find((m) => m.id === lastReadMessageId)
      if (!lastRead) return 0

      // 统计已读位置之后收到的消息数
      return received.filter((m) => m.createdAt > lastRead.createdAt).length
    } catch (error) {
      console.error('计算私聊未读数失败:', error)
      return 0
    }
  },

  /**
   * 计算群聊未读消息数（lastReadMessageId 之后的消息，排除自己发送的）
   */
  async countGroupUnreadMessages(
    groupId: string,
    currentUserId: string,
    lastReadMessageId: string,
  ): Promise<number> {
    try {
      // 检查是否为时间戳标记
      if (lastReadMessageId.startsWith('JOIN_AT_')) {
        const timestamp = lastReadMessageId.substring(8) // 移除 'JOIN_AT_' 前缀
        const messages = await db.groupMessages.where('groupId').equals(groupId).sortBy('createdAt')

        // 统计该时间戳之后的消息数（排除自己发送的）
        return messages.filter((m) => m.createdAt > timestamp && m.senderId !== currentUserId)
          .length
      }

      const messages = await db.groupMessages.where('groupId').equals(groupId).sortBy('createdAt')

      const lastRead = messages.find((m) => m.id === lastReadMessageId)
      if (!lastRead) return 0

      return messages.filter(
        (m) => m.createdAt > lastRead.createdAt && m.senderId !== currentUserId,
      ).length
    } catch (error) {
      console.error('计算群聊未读数失败:', error)
      return 0
    }
  },

  /**
   * 获取群组最新消息 ID
   * @param groupId 群组 ID
   * @returns 最新消息 ID，如果没有消息返回 null
   */
  async getLatestGroupMessageId(groupId: string): Promise<string | null> {
    try {
      const latestMessage = await db.groupMessages.where('groupId').equals(groupId).last()

      return latestMessage?.id || null
    } catch (error) {
      console.error('获取群组最新消息 ID 失败:', error)
      return null
    }
  },

  // ==================== 搜索操作 ====================

  /**
   * 搜索私聊消息（离线）
   * @param userId 对方用户 ID
   * @param currentUserId 当前用户 ID
   * @param keyword 搜索关键词
   * @returns 匹配的消息列表（按时间倒序）
   */
  async searchPrivateMessages(
    userId: string,
    currentUserId: string,
    keyword: string,
  ): Promise<PrivateMessage[]> {
    if (!keyword.trim()) {
      return []
    }

    try {
      const lowerKeyword = keyword.toLowerCase()

      // 获取所有消息（不限制数量）
      const messages = await db.privateMessages
        .where('[senderId+receiverId]')
        .equals([currentUserId, userId])
        .or('[senderId+receiverId]')
        .equals([userId, currentUserId])
        .toArray()

      // 在内存中过滤：只搜索文本消息，大小写不敏感
      const results = messages.filter(
        (msg) => msg.type === 'Text' && msg.content.toLowerCase().includes(lowerKeyword),
      )

      // 按时间倒序排序（最新的在前）
      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    } catch (error) {
      console.error('搜索私聊消息失败:', error)
      return []
    }
  },

  /**
   * 搜索群聊消息（离线）
   * @param groupId 群组 ID
   * @param keyword 搜索关键词
   * @returns 匹配的消息列表（按时间倒序）
   */
  async searchGroupMessages(groupId: string, keyword: string): Promise<GroupMessage[]> {
    if (!keyword.trim()) {
      return []
    }

    try {
      const lowerKeyword = keyword.toLowerCase()

      // 获取所有群聊消息
      const messages = await db.groupMessages.where('groupId').equals(groupId).toArray()

      // 在内存中过滤：只搜索文本消息，大小写不敏感
      const results = messages.filter(
        (msg) => msg.type === 'Text' && msg.content.toLowerCase().includes(lowerKeyword),
      )

      // 按时间倒序排序（最新的在前）
      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
    } catch (error) {
      console.error('搜索群聊消息失败:', error)
      return []
    }
  },
}
