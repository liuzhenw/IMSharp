<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, useUiStore } from '@/stores'
import {
  ConfirmationModal,
  Header,
  ChatInputBar,
  ConversationLayout,
  ChatSearchPanel,
  ChatTimeline,
} from '@/components'
import { messageStorage } from '@/services'
import { useConversationScroll } from '@/composables/useConversationScroll'
import { useConversationSearch } from '@/composables/useConversationSearch'
import { usePrivateConversationController } from '@/composables/usePrivateConversationController'
import { toConversationSearchResult } from '@/utils/conversation'
import type { PrivateMessage } from '@/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const chatId = route.params.id as string
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const {
  chatUser,
  timelineItems,
  isLoading,
  isSending,
  isLoadingOlder,
  isTyping,
  isFriendDeleted,
  hasOlderMessages,
  sendText,
  sendImage,
  handleInputChange,
  clearDeletedFriendNotification,
  loadOlderMessages,
} = usePrivateConversationController({ chatId })

const { setContainer, scrollToMessage, preserveScrollPosition } =
  useConversationScroll(timelineItems)

const {
  isSearchMode,
  searchKeyword,
  isSearching,
  results: searchResults,
  highlightedMessageId,
  toggleSearchMode,
  selectResult,
} = useConversationSearch<PrivateMessage>({
  initialSearchMode: route.query.search === 'true',
  search: (keyword) => messageStorage.searchPrivateMessages(chatId, authStore.user!.id, keyword),
  mapResult: (result, keyword) =>
    toConversationSearchResult({
      id: result.id,
      title:
        result.senderId === authStore.user?.id
          ? '我'
          : chatUser.value?.displayName || chatUser.value?.username || '对方',
      content: result.content,
      createdAt: result.createdAt,
      keyword,
    }),
  onError: (error) => {
    console.error('搜索消息失败:', error)
    uiStore.showToast('搜索失败', 'error')
  },
  scrollToMessage,
})

function handleFriendDeletedConfirm() {
  clearDeletedFriendNotification()
  router.push('/chats')
}

async function handleSendText(content: string) {
  const success = await sendText(content)
  if (success) {
    chatInputBarRef.value?.clearInput()
  }
}

async function handleReachTop() {
  await preserveScrollPosition(async () => {
    await loadOlderMessages()
  })
}

const showFriendDeletedDialog = computed(() => isFriendDeleted.value)
</script>

<template>
  <ConversationLayout root-class="h-screen">
    <template #header>
      <Header
        :title="chatUser?.displayName || chatUser?.username || '聊天详情'"
        :show-back="true"
        @back="router.push('/chats')"
      >
        <template #title>
          <div v-if="isSearchMode" class="flex flex-col items-center">
            <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">
              查找聊天记录
            </h1>
          </div>

          <div v-else-if="chatUser" class="flex flex-col items-center">
            <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">
              {{ chatUser.displayName || chatUser.username }}
            </h1>
            <span v-if="isTyping" class="text-[10px] text-slate-400 font-medium">
              正在输入...
            </span>
            <span
              v-else
              class="text-[10px] font-medium"
              :class="chatUser.isOnline ? 'text-emerald-500' : 'text-slate-400'"
            >
              {{ chatUser.isOnline ? '在线' : '离线' }}
            </span>
          </div>
          <div v-else class="flex flex-col items-center">
            <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">聊天详情</h1>
          </div>
        </template>
        <template #right>
          <button
            v-if="isSearchMode"
            @click="toggleSearchMode"
            class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <span class="material-symbols-outlined text-2xl text-slate-900 dark:text-white"
              >close</span
            >
          </button>

          <button
            v-else
            @click="router.push(`/chats/${chatId}/settings`)"
            class="flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <span class="material-symbols-outlined text-xl text-slate-900 dark:text-white"
              >more_horiz</span
            >
          </button>
        </template>
      </Header>
    </template>

    <ChatSearchPanel
      v-if="isSearchMode"
      :keyword="searchKeyword"
      :results="searchResults"
      :loading="isSearching"
      @update:keyword="searchKeyword = $event"
      @select="selectResult"
    />

    <ChatTimeline
      v-else
      :items="timelineItems"
      :loading="isLoading"
      :can-load-more-top="hasOlderMessages"
      :loading-more-top="isLoadingOlder"
      :on-reach-top="handleReachTop"
      :highlighted-message-id="highlightedMessageId"
      :set-container="setContainer"
      content-class="flex-1 min-h-0 overflow-y-auto p-4 pb-32 space-y-4 bg-slate-50 dark:bg-slate-900"
    />

    <template #input>
      <ChatInputBar
        ref="chatInputBarRef"
        :is-sending="isSending"
        @send-text="handleSendText"
        @send-image="sendImage"
        @input-change="handleInputChange"
      />
    </template>

    <ConfirmationModal
      :is-open="showFriendDeletedDialog"
      title="好友关系已删除"
      message="你已被对方删除好友关系"
      confirm-text="确定"
      @confirm="handleFriendDeletedConfirm"
      @cancel="handleFriendDeletedConfirm"
    />
  </ConversationLayout>
</template>
