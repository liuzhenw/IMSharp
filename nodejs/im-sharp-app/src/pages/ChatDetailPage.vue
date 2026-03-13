<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore, useContactsStore, useAuthStore, useUiStore } from '@/stores'
import { MessageBubble, LoadingSpinner, ConfirmationModal, Header, ChatInputBar, SearchInput } from '@/components'
import { containsScript } from '@/utils/contentValidator'
import { formatTime, formatDate } from '@/utils/time'
import { debounce } from '@/utils/debounce'
import { signalRService, messageStorage } from '@/services'
import type { PrivateMessage } from '@/types'

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const contactsStore = useContactsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const chatId = route.params.id as string
const messagesContainer = ref<HTMLElement | null>(null)
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const isLoading = ref(true)
const isSending = ref(false)
const showFriendDeletedDialog = ref(false)

// 搜索相关状态
const isSearchMode = ref(false)
const searchKeyword = ref('')
const searchResults = ref<PrivateMessage[]>([])
const isSearching = ref(false)
const highlightedMessageId = ref<string | null>(null)

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

async function handleReconnected() {
  try {
    await chatStore.loadPrivateMessages(chatId)
  } catch (error) {
    console.error('重连后恢复私聊失败:', error)
  }
}

onMounted(async () => {
  signalRService.on('Reconnected', handleReconnected)
  window.addEventListener('keydown', handleKeydown)

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

    // 检查是否需要进入搜索模式
    if (route.query.search === 'true') {
      isSearchMode.value = true
    }
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
  signalRService.off('Reconnected', handleReconnected)
  window.removeEventListener('keydown', handleKeydown)
  // 清除当前聊天 ID
  chatStore.setCurrentChatId(null)
})

// 监听新消息,自动滚动到底部
watch(messages, async () => {
  await nextTick()
  scrollToBottom()
})

// 监听好友被删除事件
watch(() => chatStore.deletedFriendId, (deletedId) => {
  console.log('[ChatDetailPage] deletedFriendId 变化:', {
    deletedId,
    chatId,
    shouldShow: deletedId === chatId
  })
  if (deletedId === chatId) {
    console.log('[ChatDetailPage] 显示好友删除对话框')
    showFriendDeletedDialog.value = true
  }
})

function handleFriendDeletedConfirm() {
  console.log('[ChatDetailPage] 用户确认好友删除提示')
  showFriendDeletedDialog.value = false
  chatStore.clearDeletedFriendNotification()
  // 返回到聊天列表页面
  router.push('/chats')
}

async function handleSendText(content: string) {
  if (containsScript(content)) {
    uiStore.showToast('消息内容包含不允许的脚本内容', 'error')
    return
  }

  isSending.value = true
  try {
    await chatStore.sendPrivateMessage(chatId, content)
    // 发送成功后清空输入框
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
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
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

// 切换搜索模式
function toggleSearchMode() {
  isSearchMode.value = !isSearchMode.value
  if (!isSearchMode.value) {
    // 退出搜索模式时清空
    searchKeyword.value = ''
    searchResults.value = []
    highlightedMessageId.value = null
  }
}

// 执行搜索（带防抖）
const performSearch = debounce(async (keyword: string) => {
  if (!keyword.trim()) {
    searchResults.value = []
    return
  }

  isSearching.value = true
  try {
    const results = await messageStorage.searchPrivateMessages(
      chatId,
      authStore.user!.id,
      keyword
    )
    searchResults.value = results
  } catch (error) {
    console.error('搜索消息失败:', error)
    uiStore.showToast('搜索失败', 'error')
  } finally {
    isSearching.value = false
  }
}, 300)

// 监听搜索关键词变化
watch(searchKeyword, (newKeyword) => {
  performSearch(newKeyword)
})

// 定位到指定消息
function scrollToMessage(messageId: string) {
  highlightedMessageId.value = messageId

  // 查找消息元素并滚动
  nextTick(() => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

      // 3 秒后取消高亮
      setTimeout(() => {
        highlightedMessageId.value = null
      }, 3000)
    }
  })

  // 关闭搜索模式
  isSearchMode.value = false
  searchKeyword.value = ''
  searchResults.value = []
}

// 高亮搜索关键词
function highlightKeyword(text: string, keyword: string): string {
  if (!keyword.trim()) return text

  const regex = new RegExp(`(${keyword})`, 'gi')
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-700">$1</mark>')
}

// 监听 ESC 键关闭搜索
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isSearchMode.value) {
    toggleSearchMode()
  }
}
</script>

<template>
  <div class="text-slate-900 dark:text-slate-100 h-screen flex flex-col relative">
    <Header :title="chatUser?.displayName || chatUser?.username || '聊天详情'" :show-back="true" @back="router.push('/chats')">
      <template #title>
        <!-- 搜索模式：显示标题 -->
        <div v-if="isSearchMode" class="flex flex-col items-center">
          <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">查找聊天记录</h1>
        </div>

        <!-- 正常模式：显示用户名 -->
        <div v-else-if="chatUser" class="flex flex-col items-center">
          <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">{{ chatUser.displayName || chatUser.username }}</h1>
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
          <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">聊天详情</h1>
        </div>
      </template>
      <template #right>
        <!-- 搜索模式：显示关闭按钮 -->
        <button
          v-if="isSearchMode"
          @click="toggleSearchMode"
          class="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <span class="material-symbols-outlined text-2xl text-slate-900 dark:text-white">close</span>
        </button>

        <!-- 正常模式：显示聊天详情菜单按钮 -->
        <button
          v-else
          @click="router.push(`/chats/${chatId}/settings`)"
          class="flex items-center justify-center p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
        >
          <span class="material-symbols-outlined text-xl text-slate-900 dark:text-white">more_horiz</span>
        </button>
      </template>
    </Header>

    <!-- 搜索输入框 -->
    <div v-if="isSearchMode" class="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
      <SearchInput
        v-model="searchKeyword"
        placeholder="搜索聊天记录..."
        class="w-full"
      />
    </div>

    <!-- 搜索结果面板 -->
    <div
      v-if="isSearchMode"
      class="flex-1 bg-white dark:bg-slate-900 overflow-y-auto"
    >
      <!-- 加载状态 -->
      <div v-if="isSearching" class="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>

      <!-- 搜索结果列表 -->
      <div v-else-if="searchResults.length > 0" class="divide-y divide-slate-200 dark:divide-slate-800">
        <div
          v-for="result in searchResults"
          :key="result.id"
          @click="scrollToMessage(result.id)"
          class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        >
          <!-- 发送者 -->
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">
            {{ result.senderId === authStore.user?.id ? '我' : (chatUser?.displayName || chatUser?.username) }}
          </div>

          <!-- 消息内容（高亮关键词） -->
          <div class="text-slate-900 dark:text-white" v-html="highlightKeyword(result.content, searchKeyword)"></div>

          <!-- 时间 -->
          <div class="text-xs text-slate-500 dark:text-slate-500 mt-1">
            {{ formatTime(result.createdAt) }}
          </div>
        </div>
      </div>

      <!-- 无结果提示 -->
      <div v-else-if="searchKeyword.trim()" class="flex flex-col items-center justify-center py-16 text-slate-500">
        <span class="material-symbols-outlined text-6xl mb-4">search_off</span>
        <p>未找到匹配的消息</p>
      </div>

      <!-- 初始提示 -->
      <div v-else class="flex flex-col items-center justify-center py-16 text-slate-500">
        <span class="material-symbols-outlined text-6xl mb-4">search</span>
        <p>输入关键词搜索聊天记录</p>
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
      class="flex-1 overflow-y-auto p-4 pb-32 space-y-4 bg-slate-50 dark:bg-slate-900"
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
          <div
            :data-message-id="message.id"
            :class="{ 'bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 -m-2': highlightedMessageId === message.id }"
            class="transition-colors duration-300"
          >
            <MessageBubble
              :content="message.content"
              :type="message.type"
              :is-self="message.senderId === authStore.user?.id"
              :time="formatTime(message.createdAt)"
              :status="message.status.toLowerCase() as 'sent' | 'delivered' | 'read'"
              :avatar="message.senderId === authStore.user?.id ? authStore.user?.avatar || undefined : chatUser?.avatar || undefined"
              :show-border="true"
            />
          </div>
        </template>
      </template>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">chat_bubble_outline</span>
        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无消息</p>
      </div>
    </main>

    <ChatInputBar ref="chatInputBarRef" :is-sending="isSending" @send-text="handleSendText" @send-image="handleSendImage" />

    <!-- 好友删除确认对话框 -->
    <ConfirmationModal
      :is-open="showFriendDeletedDialog"
      title="好友关系已删除"
      message="你已被对方删除好友关系"
      confirm-text="确定"
      @confirm="handleFriendDeletedConfirm"
      @cancel="handleFriendDeletedConfirm"
    />
  </div>
</template>
