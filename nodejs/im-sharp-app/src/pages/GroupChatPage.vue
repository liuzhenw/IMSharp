<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore, useUiStore } from '@/stores'
import {
  Header,
  ChatInputBar,
  ConversationLayout,
  ChatSearchPanel,
  ChatTimeline,
} from '@/components'
import { messageStorage } from '@/services'
import { useConversationScroll } from '@/composables/useConversationScroll'
import { useConversationSearch } from '@/composables/useConversationSearch'
import { useGroupConversationController } from '@/composables/useGroupConversationController'
import { toConversationSearchResult } from '@/utils/conversation'
import type { GroupMessage } from '@/types'

const authStore = useAuthStore()
const uiStore = useUiStore()
const route = useRoute()
const router = useRouter()

const groupId = route.params.id as string
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const showAnnouncement = ref(true)
const showAnnouncementDetail = ref(false)

const { group, members, timelineItems, isLoading, isSending, sendText, sendImage } =
  useGroupConversationController({
    groupId,
    showReconnectToast: true,
    enableJoinRetry: true,
  })

const { setContainer, scrollToMessage } = useConversationScroll(timelineItems)

async function handleSendText(content: string) {
  const success = await sendText(content)
  if (success) {
    chatInputBarRef.value?.clearInput()
  }
}

function getSenderName(senderId: string): string {
  if (senderId === authStore.user?.id) {
    return '我'
  }
  const member = members.value.find((item) => item.userId === senderId)
  if (member?.user) {
    return member.user.displayName || member.user.username
  }

  return '未知用户'
}

const {
  isSearchMode,
  searchKeyword,
  isSearching,
  results: searchResults,
  highlightedMessageId,
  toggleSearchMode,
  selectResult,
} = useConversationSearch<GroupMessage>({
  initialSearchMode: route.query.search === 'true',
  search: (keyword) => messageStorage.searchGroupMessages(groupId, keyword),
  mapResult: (result, keyword) =>
    toConversationSearchResult({
      id: result.id,
      title: getSenderName(result.senderId),
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
</script>

<template>
  <ConversationLayout root-class="h-screen">
    <template #header>
      <Header :title="group?.name || '群聊'" :show-back="true" @back="router.push('/chats')">
        <template #title>
          <div v-if="isSearchMode" class="flex flex-col items-center">
            <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">
              查找聊天记录
            </h1>
          </div>

          <div v-else-if="group" class="flex flex-col items-center">
            <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">
              {{ group.name }}
            </h1>
            <span class="text-[10px] text-slate-400 font-medium"> {{ group.memberCount }} 人 </span>
          </div>
          <div v-else class="flex flex-col items-center">
            <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">群聊</h1>
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
            @click="router.push(`/groups/${groupId}`)"
            class="flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <span class="material-symbols-outlined text-xl text-slate-900 dark:text-white"
              >more_horiz</span
            >
          </button>
        </template>
      </Header>
    </template>

    <template #top>
      <div
        v-if="!isSearchMode && group?.announcement?.content && showAnnouncement"
        @click="showAnnouncementDetail = true"
        class="bg-primary/10 dark:bg-primary/20 px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
      >
        <span class="material-symbols-outlined text-primary text-sm shrink-0">campaign</span>
        <p class="text-xs text-primary font-medium flex-1 truncate">
          {{ group.announcement?.content }}
        </p>
        <button @click.stop="showAnnouncement = false" class="text-primary/60 hover:text-primary">
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </template>

    <ChatSearchPanel
      v-if="isSearchMode"
      :keyword="searchKeyword"
      :results="searchResults"
      :loading="isSearching"
      @update:keyword="searchKeyword = $event"
      @select="selectResult"
    />

    <div
      v-if="showAnnouncementDetail"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      @click.self="showAnnouncementDetail = false"
    >
      <div class="bg-white dark:bg-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl">
        <div class="flex items-center gap-2 mb-4 text-primary">
          <span class="material-symbols-outlined">campaign</span>
          <h3 class="text-lg font-bold">群公告</h3>
        </div>
        <div class="max-h-[60vh] overflow-y-auto mb-6">
          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {{ group?.announcement?.content }}
          </p>
        </div>
        <button
          @click="showAnnouncementDetail = false"
          class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm"
        >
          我知道了
        </button>
      </div>
    </div>

    <ChatTimeline
      v-if="!isSearchMode"
      :items="timelineItems"
      :loading="isLoading"
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
      />
    </template>
  </ConversationLayout>
</template>
