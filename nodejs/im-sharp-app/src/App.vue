<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore, useUiStore, useChatStore, useContactsStore, useGroupsStore } from '@/stores'
import { Toast, FloatingActionButton } from '@/components'
import { signalRService } from '@/services/signalr'
import { SignalRConnectionState } from '@/types'

const authStore = useAuthStore()
const uiStore = useUiStore()
const chatStore = useChatStore()
const contactsStore = useContactsStore()
const groupsStore = useGroupsStore()
const route = useRoute()

const isEmbed = computed(() => !!route.meta?.isEmbed)

onMounted(async () => {
  // 初始化 UI (暗色模式)
  uiStore.initialize()

  // 注册 SignalR 状态变更回调
  signalRService.onStateChange((state: SignalRConnectionState) => {
    uiStore.setSignalRState(state)
  })

  // 初始化认证 (如果有 token,自动登录)
  await authStore.initialize()

  // 如果已登录,设置 SignalR 事件监听
  if (authStore.isAuthenticated) {
    // 设置当前用户 ID
    if (authStore.user?.id) {
      chatStore.setCurrentUserId(authStore.user.id)
    }

    chatStore.setupSignalRListeners()
    contactsStore.setupSignalRListeners()
    groupsStore.setupSignalRListeners()

    // 加载好友请求数据（用于底部导航栏 badge 显示）
    contactsStore.loadReceivedRequests().catch(err => {
      console.error('加载好友请求失败:', err)
    })

    // 从 IndexedDB 加载已读位置
    try {
      await chatStore.loadLastReadPositions()
    } catch (error) {
      console.error('加载已读位置失败:', error)
    }

    // 从 IndexedDB 恢复消息
    try {
      await chatStore.syncMessagesFromDB()
    } catch (error) {
      console.error('IndexedDB 初始化失败:', error)
    }

    // 清理 30 天前的旧消息 (后台执行,不阻塞)
    chatStore.cleanupOldMessages(30).catch(err => {
      console.error('清理旧消息失败:', err)
    })
  }
})
</script>

<template>
  <div id="app" :class="{ 'min-h-screen': !isEmbed }">
    <RouterView />

    <template v-if="!isEmbed">
      <!-- Global Toast -->
      <Toast
        v-if="uiStore.toast.visible"
        :message="uiStore.toast.message"
        :type="uiStore.toast.type"
        @close="uiStore.hideToast"
      />

      <!-- Floating Action Button -->
      <FloatingActionButton v-if="uiStore.showFloatingButton" />
    </template>
  </div>
</template>

<style scoped></style>
