<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores'
import { Header, SearchInput, ChatListItem, DropdownMenu, BottomNav } from '@/components'

const router = useRouter()
const chatStore = useChatStore()
const searchQuery = ref('')
const isMenuOpen = ref(false)

const menuItems = [
  { id: 'add-friend', label: '添加好友', icon: 'person_add' },
  { id: 'create-group', label: '创建群聊', icon: 'group_add' },
]

const filteredConversations = computed(() => {
  let conversations = chatStore.sortedConversations

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    conversations = conversations.filter(c =>
      c.name.toLowerCase().includes(query)
    )
  }

  return conversations
})

onMounted(async () => {
  await chatStore.loadConversations()
})

function handleMenuSelect(id: string) {
  if (id === 'add-friend') {
    router.push('/contacts/add')
  } else if (id === 'create-group') {
    router.push('/groups')
  }
}

function handleChatClick(chatId: string) {
  router.push(`/chats/${chatId}`)
}

function formatTime(time: string | null) {
  if (!time) return ''
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <div class="relative">
      <Header title="聊天" :show-menu="true" @menu="isMenuOpen = !isMenuOpen" />
      <DropdownMenu
        :is-open="isMenuOpen"
        :items="menuItems"
        position="right"
        @select="handleMenuSelect"
        @close="isMenuOpen = false"
      />
    </div>

    <div class="px-4 py-3 bg-white dark:bg-slate-900">
      <SearchInput v-model="searchQuery" placeholder="搜索聊天..." />
    </div>

    <div class="flex-1 overflow-y-auto pb-20 bg-white dark:bg-slate-900">
      <ChatListItem
        v-for="chat in filteredConversations"
        :key="chat.id"
        :avatar="chat.avatar || undefined"
        :name="chat.name"
        :last-message="chat.lastMessage || ''"
        :time="formatTime(chat.lastMessageTime)"
        :unread-count="chat.unreadCount"
        :online="chat.isOnline"
        :is-group="chat.type === 'group'"
        @click="handleChatClick(chat.id)"
      />
      <p v-if="filteredConversations.length === 0" class="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
        {{ searchQuery ? '未找到匹配的聊天' : '暂无聊天记录' }}
      </p>
    </div>

    <BottomNav />
  </div>
</template>
