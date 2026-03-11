import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastState {
  visible: boolean
  message: string
  type: ToastType
}

export const useUiStore = defineStore('ui', () => {
  // State - 默认为亮色模式
  const isDark = ref(false)
  const isLoading = ref(false)
  const loadingMessage = ref('')

  // Toast state
  const toast = ref<ToastState>({
    visible: false,
    message: '',
    type: 'info',
  })

  let toastTimer: number | null = null

  // Actions
  function toggleDarkMode() {
    isDark.value = !isDark.value
    localStorage.setItem('darkMode', String(isDark.value))
    updateDarkModeClass()
  }

  function setDarkMode(value: boolean) {
    isDark.value = value
    localStorage.setItem('darkMode', String(value))
    updateDarkModeClass()
  }

  function updateDarkModeClass() {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  function showLoading(message: string = '加载中...') {
    isLoading.value = true
    loadingMessage.value = message
  }

  function hideLoading() {
    isLoading.value = false
    loadingMessage.value = ''
  }

  function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
    // 清除之前的定时器
    if (toastTimer) {
      clearTimeout(toastTimer)
    }

    toast.value = {
      visible: true,
      message,
      type,
    }

    // 自动隐藏
    if (duration > 0) {
      toastTimer = window.setTimeout(() => {
        hideToast()
      }, duration)
    }
  }

  function hideToast() {
    toast.value.visible = false
    if (toastTimer) {
      clearTimeout(toastTimer)
      toastTimer = null
    }
  }

  // 初始化暗色模式
  function initialize() {
    // 从 localStorage 读取设置
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      isDark.value = savedMode === 'true'
    }
    updateDarkModeClass()
  }

  return {
    isDark,
    isLoading,
    loadingMessage,
    toast,
    toggleDarkMode,
    setDarkMode,
    showLoading,
    hideLoading,
    showToast,
    hideToast,
    initialize,
  }
})
