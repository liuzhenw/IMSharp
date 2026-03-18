import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { useEmbedStore } from '@/stores/embed'
import type { ErrorResponse } from '@/types'

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 防止并发刷新：只允许一个刷新请求在飞
let refreshPromise: Promise<any> | null = null

// 请求拦截器 - 添加 JWT token
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和 token 刷新
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    const uiStore = useUiStore()

    // 处理 401 错误 - token 过期，且未重试过
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // 复用已有的刷新请求，避免并发多次刷新
        if (!refreshPromise) {
          const authStore = useAuthStore()
          refreshPromise = authStore.refreshAccessToken().finally(() => {
            refreshPromise = null
          })
        }
        await refreshPromise

        // 用新 token 重试原请求
        const authStore = useAuthStore()
        originalRequest.headers.Authorization = `Bearer ${authStore.token}`
        return http.request(originalRequest)
      } catch {
        const authStore = useAuthStore()
        const embedStore = useEmbedStore()
        await authStore.logout()
        if (embedStore.isEmbedMode) {
          embedStore.notifyParent('token-expired')
        } else {
          uiStore.showToast('登录已过期，请重新登录', 'error')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    // 处理其他错误
    let errorMessage = '请求失败'
    if (error.response) {
      if (error.response.data?.error) {
        errorMessage = error.response.data.error
      } else {
        switch (error.response.status) {
          case 400: errorMessage = '请求参数错误'; break
          case 403: errorMessage = '没有权限访问'; break
          case 404: errorMessage = '请求的资源不存在'; break
          case 500: errorMessage = '服务器错误，请稍后重试'; break
          default: errorMessage = `请求失败 (${error.response.status})`
        }
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查网络'
    } else {
      errorMessage = error.message || '请求配置错误'
    }

    console.error('API Error:', errorMessage, error.response?.data)
    uiStore.showToast(errorMessage, 'error')
    return Promise.reject(error)
  }
)

export default http
