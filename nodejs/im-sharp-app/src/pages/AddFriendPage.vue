<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useContactsStore } from '@/stores'
import { BottomNav, LoadingSpinner, Avatar } from '@/components'
import type { User } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const contactsStore = useContactsStore()

const searchQuery = ref('')
const searchResults = ref<User[]>([])
const isSearching = ref(false)
const hasSearched = ref(false)

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    return
  }

  isSearching.value = true
  hasSearched.value = true

  try {
    searchResults.value = await contactsStore.searchUsers(searchQuery.value)
  } catch (error) {
    console.error('搜索用户失败:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

function handleUserClick(userId: string) {
  router.push(`/contacts/${userId}`)
}

function handleAddClick(event: Event, userId: string) {
  event.stopPropagation()
  // 跳转到发送好友请求页面
  router.push(`/contacts/add/${userId}`)
}

function isFriend(userId: string): boolean {
  return contactsStore.friends.some(f => f.id === userId)
}

function hasSentRequest(userId: string): boolean {
  return contactsStore.sentRequests.some(r => r.receiverId === userId && r.status === 'Pending')
}
</script>

<template>
  <div class="relative flex h-screen max-w-md mx-auto flex-col bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
    <header class="flex items-center justify-between px-4 pt-6 pb-2 bg-white dark:bg-slate-800">
      <button
        @click="router.back()"
        class="size-10 flex items-center justify-center text-slate-900 dark:text-slate-100"
      >
        <span class="material-symbols-outlined text-2xl">chevron_left</span>
      </button>
      <h1 class="text-2xl font-bold tracking-tight flex-1 text-center">添加好友</h1>
      <button
        @click="router.push('/groups')"
        class="size-10 flex items-center justify-center"
      >
        <span class="material-symbols-outlined text-2xl text-primary">group_add</span>
      </button>
    </header>

    <div class="px-4 py-3 bg-white dark:bg-slate-900">
      <div class="flex w-full items-center rounded-xl bg-slate-200/50 dark:bg-slate-800/50 px-4 py-2.5">
        <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">search</span>
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          class="flex w-full border-none bg-transparent focus:outline-0 focus:ring-0 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400"
          placeholder="搜索账号"
          type="text"
        />
      </div>
      <p class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        我的账号: <span class="text-primary font-medium">{{ authStore.user?.username || 'N/A' }}</span>
      </p>
    </div>

    <div class="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
      <!-- 搜索提示 -->
      <template v-if="!hasSearched">
        <div class="text-center py-12">
          <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 block">person_search</span>
          <p class="text-slate-500 dark:text-slate-400 text-sm">输入账号搜索好友</p>
        </div>
      </template>

      <!-- 加载中 -->
      <template v-else-if="isSearching">
        <div class="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      </template>

      <!-- 搜索结果 -->
      <template v-else-if="searchResults.length > 0">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">搜索结果</h2>
        <div
          v-for="user in searchResults"
          :key="user.id"
          @click="handleUserClick(user.id)"
          class="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Avatar
            :src="user.avatar || undefined"
            :alt="user.displayName || user.username"
            size="lg"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ user.displayName || user.username }}
            </p>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              ID: {{ user.username }}
            </p>
          </div>
          <button
            v-if="isFriend(user.id)"
            class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-full cursor-not-allowed"
            disabled
          >
            已添加
          </button>
          <button
            v-else-if="hasSentRequest(user.id)"
            class="bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-semibold px-4 py-1.5 rounded-full cursor-not-allowed"
            disabled
          >
            已发送
          </button>
          <button
            v-else
            @click="handleAddClick($event, user.id)"
            class="bg-primary text-white text-xs font-semibold px-4 py-1.5 rounded-full"
          >
            添加
          </button>
        </div>
      </template>

      <!-- 无结果 -->
      <template v-else>
        <div class="text-center py-12">
          <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4 block">person_off</span>
          <p class="text-slate-500 dark:text-slate-400 text-sm">未找到相关用户</p>
        </div>
      </template>
    </div>

    <BottomNav active-tab="contacts" />
  </div>
</template>
