<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore, useContactsStore, useAuthStore } from '@/stores'
import { MessageBubble, EmojiPicker, LoadingSpinner } from '@/components'
import type { User, PrivateMessage } from '@/types'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const contactsStore = useContactsStore()
const authStore = useAuthStore()

const chatId = route.params.id as string
const showEmojiPicker = ref(false)
const messageInput = ref('')
const messagesContainer = ref<HTMLElement | null>(null)
const isLoading = ref(true)
const isSending = ref(false)

// 获取聊天对象信息
const chatUser = computed(() => {
  return contactsStore.friends.find(f => f.id === chatId)
})

// 获取消息列表(按时间升序排序,最旧的在上,最新的在下)
const messages = computed(() => {
  const msgs = chatStore.privateMessages.get(chatId) || []
  return [...msgs].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

// 是否正在输入
const isTyping = computed(() => {
  return chatStore.typingUsers.get(chatId) || false
})

onMounted(async () => {
  try {
    // 设置当前聊天 ID
    chatStore.setCurrentChatId(chatId)

    // 加载好友信息
    if (!chatUser.value) {
      await contactsStore.loadFriends()
    }

    // 加载消息历史
    await chatStore.loadPrivateMessages(chatId)

    // 标记所有消息为已读
    await chatStore.markAllAsRead(chatId)
  } catch (error) {
    console.error('加载聊天失败:', error)
  } finally {
    isLoading.value = false
    // 等待加载状态更新和 DOM 渲染完成后滚动到底部
    await nextTick()
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }
})

onUnmounted(() => {
  // 清除当前聊天 ID
  chatStore.setCurrentChatId(null)
})

// 监听新消息,自动滚动到底部
watch(messages, async () => {
  await nextTick()
  scrollToBottom()
})

async function handleSendMessage() {
  if (!messageInput.value.trim() || isSending.value) return

  const content = messageInput.value.trim()
  messageInput.value = ''
  isSending.value = true

  try {
    await chatStore.sendPrivateMessage(chatId, content)
  } catch (error) {
    console.error('发送消息失败:', error)
    // 恢复输入内容
    messageInput.value = content
  } finally {
    isSending.value = false
  }
}

function handleEmojiSelect(emoji: string) {
  messageInput.value += emoji
}

function handleImageUpload() {
  // TODO: 实现图片上传
  console.log('上传图片')
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatTime(time: string) {
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(time: string) {
  const date = new Date(time)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '昨天'
  } else if (days < 7) {
    return `${days}天前`
  } else {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })
  }
}

// 判断是否需要显示时间分隔符
function shouldShowTimestamp(index: number): boolean {
  if (index === 0) return true
  const currentMsg = messages.value[index]
  const prevMsg = messages.value[index - 1]
  if (!currentMsg || !prevMsg) return false

  const currentTime = new Date(currentMsg.createdAt).getTime()
  const prevTime = new Date(prevMsg.createdAt).getTime()
  // 超过5分钟显示时间
  return currentTime - prevTime > 5 * 60 * 1000
}
</script>

<template>
  <div class="text-slate-900 dark:text-slate-100 h-screen flex flex-col relative">
    <header class="sticky top-0 z-10 flex items-center justify-between bg-white dark:bg-slate-800 backdrop-blur-md px-4 py-3 border-b border-slate-200 dark:border-slate-800">
      <button
        @click="router.back()"
        class="flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
      >
        <span class="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
      </button>
      <div v-if="chatUser" class="flex flex-col items-center">
        <h1 class="text-base font-bold leading-none">{{ chatUser.displayName || chatUser.username }}</h1>
        <span
          v-if="isTyping"
          class="text-[10px] text-primary font-medium"
        >
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
        <h1 class="text-base font-bold leading-none">聊天详情</h1>
      </div>
      <button
        @click="router.push(`/chats/${chatId}/settings`)"
        class="flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
      >
        <span class="material-symbols-outlined text-2xl">more_horiz</span>
      </button>
    </header>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <LoadingSpinner />
    </div>

    <!-- 消息列表 -->
    <main
      v-else
      ref="messagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900"
    >
      <template v-if="messages.length > 0">
        <template v-for="(message, index) in messages" :key="message.id">
          <!-- 时间分隔符 -->
          <div v-if="shouldShowTimestamp(index)" class="flex justify-center">
            <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              {{ formatDate(message.createdAt) }} {{ formatTime(message.createdAt) }}
            </span>
          </div>

          <!-- 消息气泡 -->
          <MessageBubble
            :content="message.content"
            :is-self="message.senderId === authStore.user?.id"
            :time="formatTime(message.createdAt)"
            :status="message.status.toLowerCase() as 'sent' | 'delivered' | 'read'"
            :avatar="message.senderId === authStore.user?.id ? authStore.user?.avatar || undefined : chatUser?.avatar || undefined"
          />
        </template>
      </template>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">chat_bubble_outline</span>
        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无消息</p>
      </div>
    </main>

    <footer class="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 p-3 pb-8 relative">
      <EmojiPicker
        :is-open="showEmojiPicker"
        @select="handleEmojiSelect"
        @close="showEmojiPicker = false"
      />

      <div class="flex items-center gap-2 max-w-4xl mx-auto">
        <div class="flex-1 relative">
          <input
            v-model="messageInput"
            @focus="showEmojiPicker = false"
            @keyup.enter="handleSendMessage"
            :disabled="isSending"
            class="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-full py-2.5 px-4 pr-12 text-sm focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:opacity-50"
            placeholder="输入消息..."
            type="text"
          />
          <button
            @click="showEmojiPicker = !showEmojiPicker"
            :disabled="isSending"
            class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50"
            :class="showEmojiPicker ? 'text-primary' : 'text-slate-500 hover:text-primary'"
          >
            <span class="material-symbols-outlined text-2xl">sentiment_satisfied</span>
          </button>
        </div>
        <button
          @click="handleImageUpload"
          :disabled="isSending"
          class="p-2 flex items-center justify-center rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <span class="material-symbols-outlined text-2xl">image</span>
        </button>
        <button
          v-if="messageInput.trim()"
          @click="handleSendMessage"
          :disabled="isSending"
          class="p-2 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <span v-if="isSending" class="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined text-2xl">send</span>
        </button>
      </div>
    </footer>
  </div>
</template>
