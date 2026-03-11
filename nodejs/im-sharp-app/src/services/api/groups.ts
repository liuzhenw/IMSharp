import http from '../http'
import type {
  CreateGroupRequest,
  GetGroupsResponse,
  GetGroupMembersResponse,
  SendGroupMessageRequest,
  GetGroupMessagesResponse,
  InviteGroupMembersRequest,
  UpdateGroupRequest,
} from '@/types'
import type { Group } from '@/types'

export const groupsApi = {
  // 创建群组
  async create(data: CreateGroupRequest): Promise<Group> {
    const response = await http.post<Group>('/api/groups', data)
    return response.data
  },

  // 获取用户加入的群组列表
  async getMyGroups(): Promise<GetGroupsResponse> {
    const response = await http.get<GetGroupsResponse>('/api/groups')
    return response.data
  },

  // 获取群组详情
  async getById(id: string): Promise<Group> {
    const response = await http.get<Group>(`/api/groups/${id}`)
    return response.data
  },

  // 获取群组成员
  async getMembers(id: string): Promise<GetGroupMembersResponse> {
    const response = await http.get<GetGroupMembersResponse>(`/api/groups/${id}/members`)
    return response.data
  },

  // 获取群组消息 (v1.2.0 更新 - 游标分页)
  async getMessages(
    groupId: string,
    options?: {
      before?: string  // 消息 ID，获取此消息之前的消息（加载历史）
      after?: string   // 消息 ID，获取此消息之后的消息（加载新消息）
      limit?: number   // 每页数量，1-100，默认 50
    }
  ): Promise<GetGroupMessagesResponse> {
    const response = await http.get<GetGroupMessagesResponse>(
      `/api/messages/group/${groupId}`,
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

  // 发送群组消息 (v1.1.0 更新 - 通过 HTTP API)
  async sendMessage(groupId: string, data: SendGroupMessageRequest): Promise<void> {
    await http.post(`/api/messages/group/${groupId}/send`, data)
  },

  // 邀请成员
  async inviteMembers(id: string, data: InviteGroupMembersRequest): Promise<void> {
    await http.post(`/api/groups/${id}/members`, data)
  },

  // 移除成员
  async removeMember(id: string, userId: string): Promise<void> {
    await http.delete(`/api/groups/${id}/members/${userId}`)
  },

  // 离开群组
  async leave(id: string): Promise<void> {
    await http.post(`/api/groups/${id}/leave`)
  },

  // 更新群组信息
  async update(id: string, data: UpdateGroupRequest): Promise<Group> {
    const response = await http.put<Group>(`/api/groups/${id}`, data)
    return response.data
  },

  // 删除群组
  async delete(id: string): Promise<void> {
    await http.delete(`/api/groups/${id}`)
  },
}
