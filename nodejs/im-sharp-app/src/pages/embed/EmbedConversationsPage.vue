<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores'
import { ChatListItem } from '@/components'
import { formatConversationTime } from '@/utils/time'

const router = useRouter()
const chatStore = useChatStore()

// 每次进入会话列表都刷新，避免新好友消息导致的重复/无名条目
onMounted(async () => {
  await chatStore.loadConversations()
})

function openConversation(conv: { id: string; type: string }) {
  if (conv.type === 'group') {
    router.push({ name: 'embed-group-chat', params: { id: conv.id } })
  } else {
    router.push({ name: 'embed-chat', params: { id: conv.id } })
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-slate-900">
    <!-- 精简顶栏 -->
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center shrink-0">
      <h2 class="text-base font-semibold text-slate-900 dark:text-white">消息</h2>
    </div>

    <!-- 会话列表：flex-1 + min-h-0 确保不撑破父容器 -->
    <div class="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-slate-900">
      <ChatListItem
        v-for="conv in chatStore.sortedConversations"
        :key="conv.id"
        :name="conv.name"
        :avatar="conv.avatar || undefined"
        :last-message="conv.lastMessage || undefined"
        :time="formatConversationTime(conv.lastMessageTime)"
        :unread-count="conv.unreadCount"
        :is-group="conv.type === 'group'"
        @click="openConversation(conv)"
      />
      <p v-if="chatStore.sortedConversations.length === 0" class="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
        暂无聊天记录
      </p>
    </div>
  </div>
</template>
