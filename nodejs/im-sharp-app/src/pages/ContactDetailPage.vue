<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactsStore, useAuthStore } from '@/stores'
import { Avatar, Button, ConfirmationModal, LoadingSpinner } from '@/components'
import type { User } from '@/types'

const route = useRoute()
const router = useRouter()
const contactsStore = useContactsStore()
const authStore = useAuthStore()

const contactId = route.params.id as string
const contact = ref<User | null>(null)
const isConfirmOpen = ref(false)
const isLoading = ref(true)
const isDeleting = ref(false)

onMounted(async () => {
  try {
    // 从好友列表中查找
    const friend = contactsStore.friends.find(f => f.id === contactId)
    if (friend) {
      contact.value = friend
    } else {
      // 如果不在好友列表中,重新加载好友列表
      await contactsStore.loadFriends()
      contact.value = contactsStore.friends.find(f => f.id === contactId) || null
    }
  } catch (error) {
    console.error('加载联系人信息失败:', error)
  } finally {
    isLoading.value = false
  }
})

async function handleDeleteConfirm() {
  isDeleting.value = true
  try {
    await contactsStore.deleteFriend(contactId)
    router.push('/contacts')
  } catch (error) {
    console.error('删除好友失败:', error)
  } finally {
    isDeleting.value = false
    isConfirmOpen.value = false
  }
}

function handleSendMessage() {
  router.push(`/chats/${contactId}`)
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-50 dark:bg-slate-900">
    <nav class="flex items-center bg-white dark:bg-slate-800 p-4 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
      <button
        @click="router.back()"
        class="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 class="text-lg font-bold flex-1 text-center text-slate-900 dark:text-white">用户详情</h1>
      <div class="size-10 flex items-center justify-center">
        <span class="material-symbols-outlined text-slate-400">more_horiz</span>
      </div>
    </nav>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- 联系人信息 -->
    <template v-else-if="contact">
      <div class="flex p-6 bg-white dark:bg-slate-800 mb-2">
        <div class="flex gap-5 items-center">
          <Avatar
            :src="contact.avatar || undefined"
            :alt="contact.displayName || contact.username"
            size="xl"
          />
          <div>
            <p class="text-2xl font-bold text-slate-900 dark:text-white">
              {{ contact.displayName || contact.username }}
            </p>
            <p class="text-primary/80 text-sm">ID: {{ contact.username }}</p>
            <div class="flex items-center gap-1 mt-1">
              <span
                class="size-2 rounded-full"
                :class="contact.isOnline ? 'bg-emerald-500' : 'bg-slate-400'"
              ></span>
              <span class="text-xs text-slate-500 dark:text-slate-400">
                {{ contact.isOnline ? '在线' : '离线' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-3 p-6">
        <Button variant="primary" full-width @click="handleSendMessage">
          <span class="material-symbols-outlined mr-2">chat</span>
          发消息
        </Button>
        <Button
          variant="danger"
          full-width
          :loading="isDeleting"
          :disabled="isDeleting"
          @click="isConfirmOpen = true"
        >
          <span class="material-symbols-outlined mr-2">person_remove</span>
          删除好友
        </Button>
      </div>
    </template>

    <!-- 未找到联系人 -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">person_off</span>
      <p class="text-slate-500 dark:text-slate-400 text-sm">未找到该联系人</p>
    </div>

    <ConfirmationModal
      :is-open="isConfirmOpen"
      title="确认删除"
      message="确定要删除这位好友吗?"
      variant="danger"
      @confirm="handleDeleteConfirm"
      @cancel="isConfirmOpen = false"
    />
  </div>
</template>
