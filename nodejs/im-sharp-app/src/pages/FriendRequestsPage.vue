<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/stores'
import { Avatar, Button, LoadingSpinner } from '@/components'

const router = useRouter()
const contactsStore = useContactsStore()

const isLoading = ref(false)
const processingRequestId = ref<string | null>(null)

onMounted(async () => {
  isLoading.value = true
  try {
    await contactsStore.loadReceivedRequests()
  } catch (error) {
    console.error('加载好友请求失败:', error)
  } finally {
    isLoading.value = false
  }
})

const pendingRequests = computed(() =>
  contactsStore.receivedRequests.filter(r => r.status === 'Pending')
)

async function handleAccept(requestId: string) {
  processingRequestId.value = requestId
  try {
    await contactsStore.processFriendRequest(requestId, true)
  } catch (error) {
    console.error('接受好友请求失败:', error)
  } finally {
    processingRequestId.value = null
  }
}

async function handleReject(requestId: string) {
  processingRequestId.value = requestId
  try {
    await contactsStore.processFriendRequest(requestId, false)
  } catch (error) {
    console.error('拒绝好友请求失败:', error)
  } finally {
    processingRequestId.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
    <header class="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-800">
      <button
        @click="router.back()"
        class="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 class="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">好友请求</h1>
    </header>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>

    <!-- 请求列表 -->
    <div v-else-if="pendingRequests.length > 0" class="p-4 space-y-3">
      <div
        v-for="request in pendingRequests"
        :key="request.id"
        class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm"
      >
        <div class="flex items-start gap-3 mb-3">
          <Avatar
            :src="request.sender?.avatar || undefined"
            :alt="request.sender?.displayName || request.sender?.username"
            size="lg"
          />
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-slate-900 dark:text-white truncate">
              {{ request.sender?.displayName || request.sender?.username }}
            </h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 truncate">
              ID: {{ request.sender?.username }}
            </p>
          </div>
        </div>

        <!-- 验证消息 -->
        <div v-if="request.message" class="mb-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
          <p class="text-xs text-slate-400 mb-1">验证消息</p>
          <p class="text-sm text-slate-700 dark:text-slate-300">{{ request.message }}</p>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            full-width
            :loading="processingRequestId === request.id"
            :disabled="processingRequestId === request.id"
            @click="handleReject(request.id)"
          >
            拒绝
          </Button>
          <Button
            variant="primary"
            size="sm"
            full-width
            :loading="processingRequestId === request.id"
            :disabled="processingRequestId === request.id"
            @click="handleAccept(request.id)"
          >
            接受
          </Button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center py-20">
      <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">person_add_disabled</span>
      <p class="text-slate-500 dark:text-slate-400 text-sm">暂无好友请求</p>
    </div>
  </div>
</template>
