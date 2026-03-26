<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEmbedStore } from '@/stores/embed'
import { ChatInputBar, ConversationLayout, ChatTimeline } from '@/components'
import { useConversationScroll } from '@/composables/useConversationScroll'
import { useGroupConversationController } from '@/composables/useGroupConversationController'

const route = useRoute()
const router = useRouter()
const embedStore = useEmbedStore()

const groupId = route.params.id as string
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const {
  group,
  timelineItems,
  isLoading,
  isSending,
  isLoadingOlder,
  hasOlderMessages,
  sendText,
  sendImage,
  loadOlderMessages,
} = useGroupConversationController({
  groupId,
  onIncomingMessage: (message) => {
    embedStore.notifyParent('new-message', {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
    })
  },
})

const { setContainer, preserveScrollPosition } = useConversationScroll(timelineItems)

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
</script>

<template>
  <ConversationLayout root-class="h-full">
    <template #header>
      <div
        class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 shrink-0"
      >
        <button
          @click="router.push('/embed')"
          class="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span class="material-symbols-outlined text-xl">arrow_back</span>
        </button>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-semibold truncate">{{ group?.name || '群聊' }}</h2>
          <span class="text-xs text-slate-400">{{ group?.memberCount }} 人</span>
        </div>
      </div>
    </template>

    <ChatTimeline
      :items="timelineItems"
      :loading="isLoading"
      :can-load-more-top="hasOlderMessages"
      :loading-more-top="isLoadingOlder"
      :on-reach-top="handleReachTop"
      :set-container="setContainer"
      content-class="flex-1 min-h-0 overflow-y-auto p-4 pb-24 space-y-4 bg-slate-50 dark:bg-slate-900"
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
