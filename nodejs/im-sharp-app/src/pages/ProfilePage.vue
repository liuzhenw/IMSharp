<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore, useUiStore, useChatStore } from '@/stores'
import { useRouter } from 'vue-router'
import { Avatar, Button, Toggle, BottomNav, ConfirmationModal } from '@/components'

const authStore = useAuthStore()
const uiStore = useUiStore()
const chatStore = useChatStore()
const router = useRouter()

const showClearCacheModal = ref(false)
const storageStats = ref({
  privateMessageCount: 0,
  groupMessageCount: 0,
  conversationCount: 0
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

async function loadStorageStats() {
  storageStats.value = await chatStore.getStorageStats()
}

async function handleClearCache() {
  try {
    await chatStore.clearLocalCache()
    uiStore.showToast('缓存已清除', 'success')
    showClearCacheModal.value = false
    await loadStorageStats()
  } catch (error) {
    uiStore.showToast('清除缓存失败', 'error')
  }
}

onMounted(() => {
  loadStorageStats()
})
</script>

<template>
  <div class="relative flex h-screen max-w-md mx-auto flex-col overflow-hidden">
    <header class="flex items-center justify-between px-4 pt-6 pb-2 bg-white dark:bg-slate-800">
      <div class="size-10"></div>
      <h1 class="text-2xl font-bold tracking-tight flex-1 text-center text-slate-900 dark:text-white">个人中心</h1>
      <div class="flex items-center justify-end size-10">
        <span class="material-symbols-outlined text-slate-400 cursor-pointer">settings</span>
      </div>
    </header>

    <div class="flex-1 flex flex-col items-center justify-start pt-12 px-6 bg-white dark:bg-slate-900">
      <div class="relative group cursor-pointer">
        <Avatar :src="authStore.user?.avatar || undefined" size="xl" />
        <div class="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full border-4 border-white dark:border-slate-900 shadow-md">
          <span class="material-symbols-outlined text-[18px] block">photo_camera</span>
        </div>
      </div>

      <div class="mt-8 flex flex-col items-center gap-2">
        <div class="flex items-center gap-2 group cursor-pointer">
          <h2 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {{ authStore.user?.displayName || '用户' }}
          </h2>
          <span class="material-symbols-outlined text-slate-400 text-xl">edit_square</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
          <p class="text-slate-500 dark:text-slate-400 text-xs font-medium">
            账号:{{ authStore.user?.username || 'N/A' }}
          </p>
          <span class="material-symbols-outlined text-slate-400 text-sm cursor-pointer">content_copy</span>
        </div>
      </div>

      <div class="mt-8 w-full space-y-3">
        <div class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
          <span class="text-slate-900 dark:text-white font-medium">暗色模式</span>
          <Toggle v-model="uiStore.isDark" @update:model-value="uiStore.toggleDarkMode" />
        </div>

        <div
          class="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          @click="showClearCacheModal = true"
        >
          <div class="flex flex-col">
            <span class="text-slate-900 dark:text-white font-medium">清除缓存</span>
            <span class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ storageStats.privateMessageCount + storageStats.groupMessageCount }} 条消息
            </span>
          </div>
          <span class="material-symbols-outlined text-slate-400">chevron_right</span>
        </div>

        <Button variant="danger" full-width @click="handleLogout">
          退出登录
        </Button>
      </div>
    </div>

    <BottomNav />

    <!-- 清除缓存确认对话框 -->
    <ConfirmationModal
      :is-open="showClearCacheModal"
      title="清除缓存"
      message="确定要清除所有本地缓存的消息吗？此操作不可恢复。"
      confirm-text="清除"
      cancel-text="取消"
      variant="danger"
      @confirm="handleClearCache"
      @cancel="showClearCacheModal = false"
    />
  </div>
</template>
