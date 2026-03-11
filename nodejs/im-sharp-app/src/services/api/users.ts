import http from '../http'
import type {
  SearchUsersResponse,
  UpdateProfileRequest,
} from '@/types'
import type { User } from '@/types'

export const usersApi = {
  // 搜索用户
  async search(keyword: string): Promise<SearchUsersResponse> {
    const response = await http.get<SearchUsersResponse>('/api/users/search', {
      params: { keyword },
    })
    return response.data
  },

  // 获取用户详情
  async getById(id: string): Promise<User> {
    const response = await http.get<User>(`/api/users/${id}`)
    return response.data
  },

  // 更新个人资料
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await http.put<User>('/api/users/profile', data)
    return response.data
  },
}
