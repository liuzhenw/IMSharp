<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore, useContactsStore } from '@/stores'
import { usersApi } from '@/services'
import { LoadingSpinner, Avatar } from '@/components'
import type { User } from '@/types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const contactsStore = useContactsStore()

const userId = route.params.id as string
const user = ref<User | null>(null)
const message = ref(`你好,我是${authStore.user?.displayName || authStore.user?.username || ''}`)
const isLoading = ref(false)
const isFetching = ref(true)

onMounted(async () => {
  try {
    user.value = await usersApi.getById(userId)
  } catch (error) {
    console.error('获取用户信息失败:', error)
    router.back()
  } finally {
    isFetching.value = false
  }
})

async function handleSend() {
  if (!user.value) return

  isLoading.value = true
  try {
    await contactsStore.sendFriendRequest(user.value.id, message.value)
    // 发送成功后返回
    router.back()
  } catch (error) {
    console.error('发送好友请求失败:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="relative flex h-screen max-w-md mx-auto flex-col bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
    <header class="flex items-center justify-between px-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800">
      <button
        @click="router.back()"
        :disabled="isLoading"
        class="size-10 flex items-center justify-center text-slate-900 dark:text-slate-100 disabled:opacity-50"
      >
        <span class="material-symbols-outlined text-2xl">chevron_left</span>
      </button>
      <h1 class="text-xl font-bold tracking-tight flex-1 text-center">发送申请</h1>
      <button
        @click="handleSend"
        :disabled="isLoading || isFetching"
        class="size-10 flex items-center justify-center text-primary font-bold text-sm disabled:opacity-50"
      >
        发送
      </button>
    </header>

    <div v-if="isFetching" class="flex-1 flex items-center justify-center">
      <LoadingSpinner />
    </div>

    <div v-else-if="user" class="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6 space-y-8">
      <!-- User Info Card -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center gap-4">
        <Avatar
          :src="user.avatar || undefined"
          :alt="user.displayName || user.username"
          size="xl"
        />
        <div class="text-center">
          <h2 class="text-xl font-bold text-slate-900 dark:text-white">
            {{ user.displayName || user.username }}
          </h2>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            账号: {{ user.username }}
          </p>
        </div>
      </div>

      <!-- Request Message -->
      <div class="space-y-3">
        <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">验证消息</label>
        <div class="relative group">
          <textarea
            v-model="message"
            rows="4"
            placeholder="输入验证消息..."
            class="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-4 px-4 text-sm focus:ring-2 focus:ring-primary/50 shadow-sm transition-all resize-none"
          ></textarea>
          <button
            @click="message = ''"
            class="absolute right-3 top-3 text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
          >
            <span class="material-symbols-outlined text-lg">cancel</span>
          </button>
        </div>
        <p class="text-[10px] text-slate-400 px-1 text-right">对方将在收到申请时看到该消息</p>
      </div>

      <div class="pt-4">
        <button
          @click="handleSend"
          :disabled="isLoading"
          class="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-80 flex items-center justify-center gap-2"
        >
          <svg
            v-if="isLoading"
            class="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isLoading ? '正在发送...' : '确定发送' }}
        </button>
      </div>
    </div>
  </div>
</template>
