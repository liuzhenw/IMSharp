import http from '../http'
import type {
  GetFriendsResponse,
  SendFriendRequestRequest,
  GetFriendRequestsResponse,
  ProcessFriendRequestRequest,
} from '@/types'

export const friendsApi = {
  // 获取好友列表
  async getFriends(): Promise<GetFriendsResponse> {
    const response = await http.get<GetFriendsResponse>('/api/friends')
    return response.data
  },

  // 发送好友请求
  async sendRequest(data: SendFriendRequestRequest): Promise<void> {
    await http.post('/api/friends/requests', data)
  },

  // 获取收到的好友请求
  async getReceivedRequests(): Promise<GetFriendRequestsResponse> {
    const response = await http.get<GetFriendRequestsResponse>('/api/friends/requests')
    return response.data
  },

  // 获取发送的好友请求
  async getSentRequests(): Promise<GetFriendRequestsResponse> {
    const response = await http.get<GetFriendRequestsResponse>('/api/friends/requests/sent')
    return response.data
  },

  // 处理好友请求
  async processRequest(id: string, data: ProcessFriendRequestRequest): Promise<void> {
    await http.put(`/api/friends/requests/${id}`, data)
  },

  // 删除好友
  async deleteFriend(friendId: string): Promise<void> {
    await http.delete(`/api/friends/${friendId}`)
  },
}
