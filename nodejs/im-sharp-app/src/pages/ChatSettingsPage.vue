<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useContactsStore, useChatStore, useUiStore } from '@/stores'
import { Avatar, ConfirmationModal } from '@/components'
import { messageStorage } from '@/services/messageStorage'

const route = useRoute()
const router = useRouter()
const contactsStore = useContactsStore()
const chatStore = useChatStore()
const uiStore = useUiStore()

const chatId = route.params.id as string
const isDoNotDisturb = ref(false)
const showClearChatModal = ref(false)

// 获取聊天对象信息
const chatUser = computed(() => {
  return contactsStore.friends.find(f => f.id === chatId)
})

onMounted(async () => {
  // 加载好友信息
  if (!chatUser.value) {
    await contactsStore.loadFriends()
  }

  // 加载消息免打扰设置
  loadDoNotDisturbSetting()
})

// 加载消息免打扰设置
function loadDoNotDisturbSetting() {
  const settings = localStorage.getItem('chatSettings')
  if (settings) {
    try {
      const parsed = JSON.parse(settings)
      isDoNotDisturb.value = parsed[chatId]?.doNotDisturb || false
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  }
}

// 保存消息免打扰设置
function saveDoNotDisturbSetting(value: boolean) {
  try {
    const settings = localStorage.getItem('chatSettings')
    const parsed = settings ? JSON.parse(settings) : {}

    if (!parsed[chatId]) {
      parsed[chatId] = {}
    }

    parsed[chatId].doNotDisturb = value
    localStorage.setItem('chatSettings', JSON.stringify(parsed))

    uiStore.showToast(
      value ? '已开启消息免打扰' : '已关闭消息免打扰',
      'success'
    )
  } catch (error) {
    console.error('保存设置失败:', error)
    uiStore.showToast('保存设置失败', 'error')
  }
}

// 切换消息免打扰
function toggleDoNotDisturb() {
  isDoNotDisturb.value = !isDoNotDisturb.value
  saveDoNotDisturbSetting(isDoNotDisturb.value)
}

// 清空聊天记录
async function handleClearChat() {
  try {
    // 1. 清空 IndexedDB 中的消息
    if (chatStore.currentUserId) {
      await messageStorage.deletePrivateMessages(chatId, chatStore.currentUserId)
    }

    // 2. 清空内存中的消息
    chatStore.privateMessages.set(chatId, [])

    // 3. 清空未读数
    chatStore.unreadCounts.set(chatId, 0)

    showClearChatModal.value = false
    uiStore.showToast('聊天记录已清空', 'success')

    // 延迟返回，让用户看到提示
    setTimeout(() => {
      router.back()
    }, 500)
  } catch (error) {
    console.error('清空聊天记录失败:', error)
    uiStore.showToast('清空聊天记录失败', 'error')
  }
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-50 dark:bg-slate-900 pb-10">
    <!-- Header -->
    <header class="flex items-center bg-white dark:bg-slate-800 p-4 pb-2 border-b border-slate-200 dark:border-slate-800">
      <button
        @click="router.back()"
        class="text-slate-900 dark:text-slate-100 flex size-10 items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
      >
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h2 class="text-slate-900 dark:text-slate-100 text-lg font-bold flex-1 text-center pr-10">
        聊天详情
      </h2>
    </header>

    <!-- User Info Card -->
    <div
      v-if="chatUser"
      @click="router.push(`/contacts/${chatId}`)"
      class="mt-4 flex items-center gap-4 bg-white dark:bg-slate-800 px-4 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <Avatar :src="chatUser.avatar || undefined" size="lg" />
      <div class="flex-1">
        <p class="text-lg font-bold text-slate-900 dark:text-white">
          {{ chatUser.displayName || chatUser.username }}
        </p>
        <p class="text-primary text-sm">查看个人资料</p>
      </div>
      <span class="material-symbols-outlined text-slate-400">chevron_right</span>
    </div>

    <!-- Settings Options -->
    <div class="mt-6 bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-700">
      <div class="flex items-center justify-between px-4 py-4 border-b border-slate-50 dark:border-slate-700">
        <span class="text-slate-900 dark:text-white">查找聊天记录</span>
        <span class="material-symbols-outlined text-slate-400">chevron_right</span>
      </div>
      <div class="flex items-center justify-between px-4 py-4">
        <span class="text-slate-900 dark:text-white">消息免打扰</span>
        <button
          @click="toggleDoNotDisturb"
          :class="[
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
            isDoNotDisturb ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
          ]"
        >
          <span
            :class="[
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              isDoNotDisturb ? 'translate-x-6' : 'translate-x-1'
            ]"
          />
        </button>
      </div>
    </div>

    <!-- Clear Chat Button -->
    <div class="mt-8 px-4 space-y-3">
      <button
        @click="showClearChatModal = true"
        class="w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-500 font-semibold py-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
      >
        清空聊天记录
      </button>
    </div>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :is-open="showClearChatModal"
      title="清空聊天记录"
      :message="`确定要清空与 ${chatUser?.displayName || chatUser?.username || '该用户'} 的聊天记录吗？此操作不可撤销。`"
      confirm-text="清空"
      cancel-text="取消"
      variant="danger"
      @confirm="handleClearChat"
      @cancel="showClearChatModal = false"
    />
  </div>
</template>
