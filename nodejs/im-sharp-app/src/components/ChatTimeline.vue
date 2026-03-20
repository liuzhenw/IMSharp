<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import LoadingSpinner from './LoadingSpinner.vue'
import MessageBubble from './MessageBubble.vue'
import type { ConversationTimelineItem } from '@/types/conversation'

interface Props {
  items: ConversationTimelineItem[]
  loading?: boolean
  emptyText?: string
  highlightedMessageId?: string | null
  setContainer?: ((element: HTMLElement | null) => void) | null
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  emptyText: '暂无消息',
  highlightedMessageId: null,
  setContainer: null,
  contentClass: 'flex-1 overflow-y-auto p-4 pb-32 space-y-4 bg-slate-50 dark:bg-slate-900',
})

function setContainerRef(element: Element | ComponentPublicInstance | null) {
  props.setContainer?.(element as HTMLElement | null)
}
</script>

<template>
  <div v-if="loading" class="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <LoadingSpinner />
  </div>

  <main v-else :ref="setContainerRef" :class="contentClass">
    <template v-if="items.length > 0">
      <template v-for="item in items" :key="item.id">
        <div v-if="item.kind === 'system'" class="flex justify-center">
          <span
            class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"
          >
            {{ item.text }}
          </span>
        </div>

        <template v-else>
          <div v-if="item.showTimestamp" class="flex justify-center">
            <span
              class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full"
            >
              {{ item.timestampLabel }}
            </span>
          </div>

          <div
            :data-message-id="item.id"
            :class="[
              'transition-colors duration-300',
              highlightedMessageId === item.id
                ? 'bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 -m-2'
                : '',
            ]"
          >
            <MessageBubble
              :content="item.bubble.content"
              :type="item.bubble.type"
              :is-self="item.bubble.isSelf"
              :time="item.bubble.time"
              :status="item.bubble.status"
              :avatar="item.bubble.avatar"
              :sender-name="item.bubble.senderName"
              :show-border="true"
            />
          </div>
        </template>
      </template>
    </template>

    <div v-else class="flex flex-col items-center justify-center py-20">
      <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">
        chat_bubble_outline
      </span>
      <p class="text-slate-500 dark:text-slate-400 text-sm">{{ emptyText }}</p>
    </div>
  </main>
</template>
