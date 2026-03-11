import http from '../http'
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RevokeTokenRequest,
} from '@/types'
import type { User } from '@/types'

export const authApi = {
  // 登录
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>('/api/auth/login', data)
    return response.data
  },

  // 刷新 token
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await http.post<RefreshTokenResponse>('/api/auth/refresh', {
      refreshToken,
    } as RefreshTokenRequest)
    return response.data
  },

  // 撤销 token
  async revoke(refreshToken: string): Promise<void> {
    await http.post('/api/auth/revoke', {
      refreshToken,
    } as RevokeTokenRequest)
  },

  // 获取当前用户信息
  async me(): Promise<User> {
    const response = await http.get<User>('/api/auth/me')
    return response.data
  },
}
