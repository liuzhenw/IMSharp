<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore, useContactsStore, useAuthStore, useUiStore } from '@/stores'
import { useEmbedStore } from '@/stores/embed'
import { MessageBubble, LoadingSpinner, ChatInputBar } from '@/components'
import { containsScript } from '@/utils/contentValidator'
import { formatTime, formatDate } from '@/utils/time'
import { signalRService } from '@/services'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const contactsStore = useContactsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const embedStore = useEmbedStore()

const chatId = route.params.id as string
const messagesContainer = ref<HTMLElement | null>(null)
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const isLoading = ref(true)
const isSending = ref(false)

const chatUser = computed(() => contactsStore.friends.find(f => f.id === chatId))

const messages = computed(() => {
  const msgs = chatStore.privateMessages.get(chatId) || []
  return [...msgs].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

const isTyping = computed(() => chatStore.typingUsers.get(chatId) || false)

async function handleReconnected() {
  try {
    await chatStore.loadPrivateMessages(chatId)
  } catch (error) {
    console.error('重连后恢复私聊失败:', error)
  }
}

onMounted(async () => {
  signalRService.on('Reconnected', handleReconnected)

  try {
    chatStore.setCurrentChatId(chatId)
    if (!chatUser.value) {
      await contactsStore.loadFriends()
    }
    await chatStore.loadPrivateMessages(chatId)
    await chatStore.markAllAsRead(chatId)
  } catch (error) {
    console.error('加载聊天失败:', error)
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
})

onUnmounted(() => {
  signalRService.off('Reconnected', handleReconnected)
  chatStore.setCurrentChatId(null)
})

watch(messages, async (newMsgs, oldMsgs) => {
  await nextTick()
  scrollToBottom()
  // 通知父页面新消息
  if (newMsgs.length > (oldMsgs?.length ?? 0)) {
    const latest = newMsgs[newMsgs.length - 1]
    if (latest && latest.senderId !== authStore.user?.id) {
      embedStore.notifyParent('new-message', {
        id: latest.id,
        content: latest.content,
        senderId: latest.senderId,
      })
    }
  }
})

async function handleSendText(content: string) {
  if (containsScript(content)) {
    uiStore.showToast('消息内容包含不允许的脚本内容', 'error')
    return
  }
  isSending.value = true
  try {
    await chatStore.sendPrivateMessage(chatId, content)
    chatInputBarRef.value?.clearInput()
  } catch (error) {
    console.error('发送消息失败:', error)
    uiStore.showToast('发送消息失败', 'error')
  } finally {
    isSending.value = false
  }
}

async function handleSendImage(url: string) {
  try {
    await chatStore.sendPrivateMessage(chatId, url, 'Image')
  } catch (error) {
    console.error('发送图片失败:', error)
    uiStore.showToast('图片发送失败', 'error')
  }
}

function scrollToBottom() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  })
}

function shouldShowTimestamp(index: number): boolean {
  if (index === 0) return true
  const cur = messages.value[index]
  const prev = messages.value[index - 1]
  if (!cur || !prev) return false
  return new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000
}
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
    <!-- 顶栏 -->
    <div class="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 shrink-0">
      <button
        @click="router.push('/embed')"
        class="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span class="material-symbols-outlined text-xl">arrow_back</span>
      </button>
      <div class="flex-1 min-w-0">
        <h2 class="text-base font-semibold truncate">{{ chatUser?.displayName || chatUser?.username || '聊天' }}</h2>
        <span class="text-xs" :class="chatUser?.isOnline ? 'text-emerald-500' : 'text-slate-400'">
          {{ isTyping ? '正在输入...' : (chatUser?.isOnline ? '在线' : '离线') }}
        </span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <LoadingSpinner />
    </div>

    <!-- 消息列表 -->
    <main
      v-else
      ref="messagesContainer"
      class="flex-1 min-h-0 overflow-y-auto p-4 pb-24 space-y-4 bg-slate-50 dark:bg-slate-900"
    >
      <template v-if="messages.length > 0">
        <template v-for="(message, index) in messages" :key="message.id">
          <div v-if="shouldShowTimestamp(index)" class="flex justify-center">
            <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              {{ formatDate(message.createdAt) }} {{ formatTime(message.createdAt) }}
            </span>
          </div>
          <MessageBubble
            :content="message.content"
            :type="message.type"
            :is-self="message.senderId === authStore.user?.id"
            :time="formatTime(message.createdAt)"
            :status="message.status.toLowerCase() as 'sent' | 'delivered' | 'read'"
            :avatar="message.senderId === authStore.user?.id ? authStore.user?.avatar || undefined : chatUser?.avatar || undefined"
            :show-border="true"
          />
        </template>
      </template>
      <div v-else class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">chat_bubble_outline</span>
        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无消息</p>
      </div>
    </main>

    <ChatInputBar ref="chatInputBarRef" :is-sending="isSending" @send-text="handleSendText" @send-image="handleSendImage" />
  </div>
</template>
