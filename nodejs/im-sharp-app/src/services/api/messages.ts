import http from '../http'
import type {
  GetConversationResponse,
  GetUnreadMessagesResponse,
  SendMessageRequest,
} from '@/types'

export const messagesApi = {
  // 获取会话消息 (v1.2.0 更新 - 游标分页)
  async getConversation(
    friendId: string,
    options?: {
      before?: string  // 消息 ID，获取此消息之前的消息（加载历史）
      after?: string   // 消息 ID，获取此消息之后的消息（加载新消息）
      limit?: number   // 每页数量，1-100，默认 50
    }
  ): Promise<GetConversationResponse> {
    const response = await http.get<GetConversationResponse>(
      `/api/messages/private/conversations/${friendId}`,
      {
        params: {
          before: options?.before,
          after: options?.after,
          limit: options?.limit || 50,
        },
      }
    )
    return response.data
  },

  // 获取私聊未读消息数 (v1.1.0 更新)
  async getUnread(): Promise<GetUnreadMessagesResponse> {
    const response = await http.get<GetUnreadMessagesResponse>('/api/messages/private/unread')
    return response.data
  },

  // 获取统一未读消息数 (私聊 + 群聊) (v1.1.0 新增)
  async getAllUnread(): Promise<GetUnreadMessagesResponse> {
    const response = await http.get<GetUnreadMessagesResponse>('/api/messages/unread')
    return response.data
  },

  // 标记消息为已读 (v1.1.0 更新)
  async markAsRead(messageId: string): Promise<void> {
    await http.put(`/api/messages/private/${messageId}/read`)
  },

  // 标记所有消息为已读 (v1.1.0 更新)
  async markAllAsRead(friendId: string): Promise<void> {
    await http.put(`/api/messages/private/conversations/${friendId}/read-all`)
  },

  // 发送私聊消息 (v1.1.0 新增 - 通过 HTTP API)
  async send(data: SendMessageRequest): Promise<void> {
    await http.post('/api/messages/private/send', data)
  },
}
