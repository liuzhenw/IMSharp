import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { authApi } from '@/services'
import { signalRService } from '@/services'
import type { User, LoginRequest } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('token'))
  const refreshToken = ref<string | null>(localStorage.getItem('refreshToken'))
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  // 从 localStorage 恢复用户信息
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch (error) {
      console.error('Failed to parse saved user:', error)
      localStorage.removeItem('user')
    }
  }

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // Actions
  async function login(oAuthAccessToken: string) {
    isLoading.value = true
    try {
      const response = await authApi.login({ oAuthAccessToken } as LoginRequest)

      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      user.value = response.user

      // 保存到 localStorage
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)
      localStorage.setItem('user', JSON.stringify(response.user))

      // 设置 chatStore 的 currentUserId
      const { useChatStore } = await import('@/stores')
      const chatStore = useChatStore()
      chatStore.setCurrentUserId(response.user.id)

      // 连接 SignalR
      await signalRService.connect(response.accessToken)

      return response
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loginWithOAuthToken(oAuthToken: string, skipPersist: boolean = false) {
    isLoading.value = true
    try {
      const response = await authApi.login({ oAuthAccessToken: oAuthToken } as LoginRequest)

      token.value = response.accessToken
      refreshToken.value = response.refreshToken
      user.value = response.user

      if (!skipPersist) {
        localStorage.setItem('token', response.accessToken)
        localStorage.setItem('refreshToken', response.refreshToken)
        localStorage.setItem('user', JSON.stringify(response.user))
      }

      // 设置 chatStore 的 currentUserId
      const { useChatStore } = await import('@/stores')
      const chatStore = useChatStore()
      chatStore.setCurrentUserId(response.user.id)

      // 连接 SignalR
      await signalRService.connect(response.accessToken)

      return response
    } catch (error) {
      console.error('loginWithOAuthToken failed:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function refreshAccessToken() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await authApi.refresh(refreshToken.value)

      token.value = response.accessToken
      refreshToken.value = response.refreshToken

      // 更新 localStorage
      localStorage.setItem('token', response.accessToken)
      localStorage.setItem('refreshToken', response.refreshToken)

      // 更新 SignalR 连接的 token（不断开重连）
      signalRService.updateAccessToken(response.accessToken)

      return response
    } catch (error) {
      console.error('Token refresh failed:', error)
      logout()
      throw error
    }
  }

  async function fetchCurrentUser() {
    if (!token.value) {
      return
    }

    try {
      user.value = await authApi.me()
      // 保存到 localStorage
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (error) {
      console.error('Fetch current user failed:', error)
      throw error
    }
  }

  async function logout() {
    try {
      if (refreshToken.value) {
        await authApi.revoke(refreshToken.value)
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      // 断开 SignalR
      await signalRService.disconnect()

      // 清除状态
      token.value = null
      refreshToken.value = null
      user.value = null

      // 清除 localStorage
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    }
  }

  async function updateProfile(displayName: string, avatar?: string) {
    try {
      const updatedUser = await authApi.updateProfile(displayName, avatar)
      user.value = updatedUser
      // 保存到 localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser))
      return updatedUser
    } catch (error) {
      console.error('Update profile failed:', error)
      throw error
    }
  }

  // 初始化 - 如果有 token,获取用户信息并连接 SignalR
  async function initialize() {
    if (token.value) {
      try {
        await fetchCurrentUser()

        // 设置 chatStore 的 currentUserId
        if (user.value) {
          const { useChatStore } = await import('@/stores')
          const chatStore = useChatStore()
          chatStore.setCurrentUserId(user.value.id)
        }

        await signalRService.connect(token.value)
      } catch (error) {
        console.error('Initialize failed:', error)
        logout()
      }
    }
  }

  return {
    token,
    refreshToken,
    user,
    isLoading,
    isAuthenticated,
    login,
    loginWithOAuthToken,
    refreshAccessToken,
    fetchCurrentUser,
    logout,
    updateProfile,
    initialize,
  }
})
