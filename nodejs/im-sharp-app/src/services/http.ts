import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import type { ErrorResponse } from '@/types'

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

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
  (response) => {
    return response
  },
  async (error: AxiosError<ErrorResponse>) => {
    const originalRequest = error.config
    const uiStore = useUiStore()

    // 处理 401 错误 - token 过期
    if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
      try {
        const authStore = useAuthStore()
        await authStore.refreshAccessToken()

        // 标记请求已重试,避免无限循环
        originalRequest.headers['X-Retry'] = 'true'

        // 重试原请求
        return http.request(originalRequest)
      } catch (refreshError) {
        // 刷新 token 失败,清除认证信息并跳转到登录页
        const authStore = useAuthStore()
        authStore.logout()
        uiStore.showToast('登录已过期,请重新登录', 'error')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    // 处理其他错误
    let errorMessage = '请求失败'

    if (error.response) {
      // 优先使用服务器返回的错误消息
      if (error.response.data?.error) {
        errorMessage = error.response.data.error
      } else {
        // 如果没有服务器消息,使用默认消息
        switch (error.response.status) {
          case 400:
            errorMessage = '请求参数错误'
            break
          case 403:
            errorMessage = '没有权限访问'
            break
          case 404:
            errorMessage = '请求的资源不存在'
            break
          case 500:
            errorMessage = '服务器错误,请稍后重试'
            break
          default:
            errorMessage = `请求失败 (${error.response.status})`
        }
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '网络连接失败,请检查网络'
    } else {
      // 请求配置错误
      errorMessage = error.message || '请求配置错误'
    }

    console.error('API Error:', errorMessage, error.response?.data)

    // 显示错误提示
    uiStore.showToast(errorMessage, 'error')

    return Promise.reject(error)
  }
)

export default http
