<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore, useChatStore, useContactsStore, useGroupsStore, useUiStore } from '@/stores'
import { useEmbedStore } from '@/stores/embed'
import { LoadingSpinner } from '@/components'
import { signalRService } from '@/services/signalr'
import { SignalRConnectionState } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const chatStore = useChatStore()
const contactsStore = useContactsStore()
const groupsStore = useGroupsStore()
const uiStore = useUiStore()
const embedStore = useEmbedStore()

const isLoading = ref(true)
const authError = ref(false)

const connectionBanner = computed(() => {
  const state = uiStore.signalRState
  if (state === SignalRConnectionState.Reconnecting) {
    return { text: '连接已断开，正在重连...', icon: 'sync', class: 'bg-yellow-500' }
  }
  if (state === SignalRConnectionState.Disconnected) {
    return { text: '连接已断开', icon: 'cloud_off', class: 'bg-red-500' }
  }
  if (state === SignalRConnectionState.Connecting) {
    return { text: '正在连接...', icon: 'sync', class: 'bg-yellow-500' }
  }
  return null
})

function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

function handleParentMessage(event: MessageEvent) {
  if (!event.data || event.data.source !== 'imsharp-host') return

  const { type, data } = event.data
  if (type === 'update-token' && data?.oAuthToken) {
    authStore.loginWithOAuthToken(data.oAuthToken, true).catch(console.error)
  } else if (type === 'set-theme' && data?.theme) {
    embedStore.configure({ theme: data.theme, parentOrigin: embedStore.parentOrigin })
    applyTheme(embedStore.theme)
  }
}

onMounted(async () => {
  const oAuthToken = route.query.oAuthToken as string
  const theme = route.query.theme as string
  const parentOrigin = route.query.parentOrigin as string

  embedStore.configure({ theme, parentOrigin })

  // 标记 embed 模式，应用高度和主题
  document.documentElement.classList.add('embed-mode')
  applyTheme(embedStore.theme)

  signalRService.onStateChange((state: SignalRConnectionState) => {
    uiStore.setSignalRState(state)
  })
  window.addEventListener('message', handleParentMessage)

  if (!oAuthToken) {
    authError.value = true
    isLoading.value = false
    return
  }

  try {
    await authStore.loginWithOAuthToken(oAuthToken, true)

    chatStore.setupSignalRListeners()
    contactsStore.setupSignalRListeners()
    groupsStore.setupSignalRListeners()

    await chatStore.loadConversations()

    embedStore.notifyParent('ready')
  } catch (error) {
    console.error('[EmbedLayout] 认证失败:', error)
    authError.value = true
    embedStore.notifyParent('error', { message: '认证失败' })
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('message', handleParentMessage)
  document.documentElement.classList.remove('embed-mode', 'dark')
})

// 未读数变化时通知父页面（immediate: true 确保初始值也触发）
watch(() => chatStore.totalUnreadCount, (count) => {
  embedStore.notifyParent('unread-count-changed', { count })
}, { immediate: true })

// 连接状态变化时通知父页面
watch(() => uiStore.signalRState, (state) => {
  embedStore.notifyParent('connection-state-changed', { state })
}, { immediate: true })
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- 连接状态横幅 -->
    <div
      v-if="connectionBanner"
      :class="connectionBanner.class"
      class="text-white text-xs text-center py-1.5 flex items-center justify-center gap-1.5 shrink-0"
    >
      <span class="material-symbols-outlined text-sm animate-spin" v-if="connectionBanner.icon === 'sync'">sync</span>
      <span class="material-symbols-outlined text-sm" v-else>{{ connectionBanner.icon }}</span>
      {{ connectionBanner.text }}
    </div>

    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <LoadingSpinner />
    </div>
    <div v-else-if="authError" class="flex-1 flex items-center justify-center text-red-500 text-sm p-4">
      认证失败，请刷新重试
    </div>
    <RouterView v-else class="flex-1 min-h-0" />
  </div>
</template>
