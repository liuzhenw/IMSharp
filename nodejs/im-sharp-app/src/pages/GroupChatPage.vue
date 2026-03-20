<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore, useGroupsStore, useAuthStore, useUiStore } from '@/stores'
import { MessageBubble, LoadingSpinner, Header, ChatInputBar, SearchInput } from '@/components'
import { containsScript } from '@/utils/contentValidator'
import { formatTime, formatDate } from '@/utils/time'
import { debounce } from '@/utils/debounce'
import { signalRService, messageStorage } from '@/services'
import type { GroupMessage, User } from '@/types'

interface SystemEvent {
  id: string
  type: 'system'
  text: string
  createdAt: string
}

const systemEvents = ref<SystemEvent[]>([])

// 合并消息和系统事件，按时间排序
const allItems = computed(() => {
  const msgs = messages.value.map(m => ({ ...m, type: m.type as string }))
  return [...msgs, ...systemEvents.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()

const groupId = route.params.id as string
const messagesContainer = ref<HTMLElement | null>(null)
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const isLoading = ref(true)
const isSending = ref(false)
const showAnnouncement = ref(true)
const showAnnouncementDetail = ref(false)

// 搜索相关状态
const isSearchMode = ref(false)
const searchKeyword = ref('')
const searchResults = ref<GroupMessage[]>([])
const isSearching = ref(false)
const highlightedMessageId = ref<string | null>(null)

// 获取群组信息
const group = computed(() => {
  return groupsStore.groups.find(g => g.id === groupId)
})

// 获取群组成员
const members = computed(() => {
  return groupsStore.groupMembers.get(groupId) || []
})

// 获取消息列表(按时间升序排序,最旧的在上,最新的在下)
const messages = computed(() => {
  const msgs = chatStore.groupMessages.get(groupId) || []
  return [...msgs].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

function handleMemberJoined(member: import('@/types').GroupMember) {
  if (member.groupId !== groupId) return
  const userId = member.userId || member.user?.id || 'unknown'
  const name = member.user?.displayName || member.user?.username || '新成员'
  systemEvents.value.push({
    id: `join-${userId}-${Date.now()}`,
    type: 'system',
    text: `${name} 加入了群聊`,
    createdAt: new Date().toISOString(),
  })
}

function handleMemberLeft(gId: string, userId: string) {
  if (gId !== groupId) return
  const member = members.value.find(m => m.userId === userId)
  const name = member?.user?.displayName || member?.user?.username || '成员'
  systemEvents.value.push({
    id: `leave-${userId}-${Date.now()}`,
    type: 'system',
    text: `${name} 离开了群聊`,
    createdAt: new Date().toISOString(),
  })
}

async function handleReconnected() {
  console.log('[GroupChatPage] SignalR 重连，尝试恢复群聊')
  try {
    await signalRService.joinGroup(groupId)
    console.log('[GroupChatPage] 重连后成功加入群组房间')

    // 加载可能错过的消息
    await chatStore.loadGroupMessages(groupId)
    console.log('[GroupChatPage] 重连后消息同步完成')

    uiStore.showToast('连接已恢复', 'success')
  } catch (error) {
    console.error('[GroupChatPage] 重连后恢复群聊失败:', error)
    uiStore.showToast('连接恢复失败，请刷新页面', 'error')
  }
}

onMounted(async () => {
  signalRService.on('Reconnected', handleReconnected)
  signalRService.on('GroupMemberJoined', handleMemberJoined)
  signalRService.on('MemberLeftGroup', handleMemberLeft)
  window.addEventListener('keydown', handleKeydown)

  try {
    // 设置当前聊天 ID
    chatStore.setCurrentChatId(groupId)

    // 加载群组信息
    if (!group.value) {
      await groupsStore.loadGroups()
    }

    // 加载群组成员
    await groupsStore.loadGroupMembers(groupId)

    // 加入 SignalR 群组房间（独立错误处理）
    let joinGroupSuccess = false
    try {
      console.log('[GroupChatPage] 尝试加入群组房间:', groupId)
      await signalRService.joinGroup(groupId)
      joinGroupSuccess = true
      console.log('[GroupChatPage] 成功加入群组房间')
    } catch (joinError) {
      console.error('[GroupChatPage] 加入群组房间失败:', joinError)
      // 不抛出异常，继续执行后续步骤
      uiStore.showToast('无法接收实时消息，正在尝试重连...', 'warning')

      // 延迟重试
      setTimeout(async () => {
        try {
          console.log('[GroupChatPage] 重试加入群组房间')
          await signalRService.joinGroup(groupId)
          console.log('[GroupChatPage] 重试成功')
          uiStore.showToast('已恢复实时消息接收', 'success')
        } catch (retryError) {
          console.error('[GroupChatPage] 重试失败:', retryError)
          uiStore.showToast('无法接收实时消息，请刷新页面', 'error')
        }
      }, 3000)
    }

    // 加载消息历史（即使 joinGroup 失败也执行）
    await chatStore.loadGroupMessages(groupId)

    // 标记群聊消息为已读（清除未读数）
    chatStore.clearUnreadCount(groupId)

    // 检查是否需要进入搜索模式
    if (route.query.search === 'true') {
      isSearchMode.value = true
    }
  } catch (error) {
    console.error('[GroupChatPage] 加载群聊失败:', error)
    uiStore.showToast('加载群聊失败', 'error')
  } finally {
    isLoading.value = false
    // 等待加载状态更新和 DOM 渲染完成后滚动到底部
    await nextTick()
    setTimeout(() => {
      scrollToBottom()
    }, 100)
  }
})

onUnmounted(async () => {
  signalRService.off('Reconnected', handleReconnected)
  signalRService.off('GroupMemberJoined', handleMemberJoined)
  signalRService.off('MemberLeftGroup', handleMemberLeft)
  window.removeEventListener('keydown', handleKeydown)

  // 清除当前聊天 ID
  chatStore.setCurrentChatId(null)
})

// 监听新消息,自动滚动到底部
watch(allItems, async () => {
  await nextTick()
  scrollToBottom()
})

async function handleSendText(content: string) {
  if (containsScript(content)) {
    uiStore.showToast('消息内容包含不允许的脚本内容', 'error')
    return
  }

  isSending.value = true
  try {
    await chatStore.sendGroupMessage(groupId, content)
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
    await chatStore.sendGroupMessage(groupId, url, 'Image')
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
  const item = allItems.value[index]
  if (!item || item.type === 'system') return false
  if (index === 0) return true

  // 找前一个非系统消息
  let prevIndex = index - 1
  while (prevIndex >= 0 && allItems.value[prevIndex]?.type === 'system') {
    prevIndex--
  }
  if (prevIndex < 0) return true

  const prevItem = allItems.value[prevIndex]
  if (!prevItem) return false
  return new Date(item.createdAt).getTime() - new Date(prevItem.createdAt).getTime() > 5 * 60 * 1000
}

// 获取消息发送者信息
function getSenderInfo(message: GroupMessage) {
  // 如果消息包含 sender 信息,直接使用
  if (message.sender) {
    return {
      displayName: message.sender.displayName || message.sender.username,
      avatar: message.sender.avatar
    }
  }

  // 获取发送者 ID（兼容两种格式）
  const senderId = message.senderId || (message as any).sender?.id

  // 否则从成员列表中查找
  const member = members.value.find(m => m.userId === senderId)
  if (member?.user) {
    return {
      displayName: member.user.displayName || member.user.username,
      avatar: member.user.avatar
    }
  }

  // 如果是当前用户
  if (senderId && authStore.user && senderId === authStore.user.id) {
    return {
      displayName: authStore.user.displayName || authStore.user.username,
      avatar: authStore.user.avatar
    }
  }

  // 默认值
  return {
    displayName: '未知用户',
    avatar: null
  }
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
    const results = await messageStorage.searchGroupMessages(groupId, keyword)
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

// 获取发送者昵称
function getSenderName(senderId: string): string {
  if (senderId === authStore.user?.id) {
    return '我'
  }
  const member = members.value.find(m => m.userId === senderId)
  return member?.user?.displayName || member?.user?.username || '未知用户'
}

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
    <Header :title="group?.name || '群聊'" :show-back="true" @back="router.push('/chats')">
      <template #title>
        <!-- 搜索模式：显示标题 -->
        <div v-if="isSearchMode" class="flex flex-col items-center">
          <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">查找聊天记录</h1>
        </div>

        <!-- 正常模式：显示群组名 -->
        <div v-else-if="group" class="flex flex-col items-center">
          <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">{{ group.name }}</h1>
          <span class="text-[10px] text-slate-400 font-medium">
            {{ group.memberCount }} 人
          </span>
        </div>
        <div v-else class="flex flex-col items-center">
          <h1 class="text-lg font-bold leading-none text-slate-900 dark:text-white">群聊</h1>
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

        <!-- 正常模式：显示群组设置菜单按钮 -->
        <button
          v-else
          @click="router.push(`/groups/${groupId}`)"
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
            {{ getSenderName(result.senderId) }}
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

    <!-- 群公告栏 -->
    <div
      v-if="group?.announcement?.content && showAnnouncement"
      @click="showAnnouncementDetail = true"
      class="bg-primary/10 dark:bg-primary/20 px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
    >
      <span class="material-symbols-outlined text-primary text-sm shrink-0">campaign</span>
      <p class="text-xs text-primary font-medium flex-1 truncate">{{ group.announcement?.content }}</p>
      <button
        @click.stop="showAnnouncement = false"
        class="text-primary/60 hover:text-primary"
      >
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    </div>

    <!-- 公告详情弹窗 -->
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
          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{{ group?.announcement?.content }}</p>
        </div>
        <button
          @click="showAnnouncementDetail = false"
          class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm"
        >我知道了</button>
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
      <template v-if="allItems.length > 0">
        <template v-for="(item, index) in allItems" :key="item.id">
          <!-- 系统消息 -->
          <div v-if="item.type === 'system'" class="flex justify-center">
            <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {{ (item as any).text }}
            </span>
          </div>

          <template v-else>
          <!-- 时间分隔符 -->
          <div v-if="shouldShowTimestamp(index)" class="flex justify-center">
            <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
              {{ formatDate(item.createdAt) }} {{ formatTime(item.createdAt) }}
            </span>
          </div>

          <!-- 消息气泡 -->
          <MessageBubble
            :content="(item as any).content"
            :type="item.type as 'Text' | 'Image' | 'File' | 'Audio' | 'Video'"
            :is-self="((item as any).senderId || (item as any).sender?.id) === authStore.user?.id"
            :time="formatTime(item.createdAt)"
            :avatar="((item as any).senderId || (item as any).sender?.id) === authStore.user?.id
              ? authStore.user?.avatar || undefined
              : getSenderInfo(item as any).avatar || undefined"
            :sender-name="((item as any).senderId || (item as any).sender?.id) !== authStore.user?.id
              ? getSenderInfo(item as any).displayName
              : undefined"
            :show-border="true"
            :data-message-id="item.id"
            :class="[
              'transition-colors duration-300',
              highlightedMessageId === item.id ? 'bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-2 -m-2' : ''
            ]"
          />
          </template>
        </template>
      </template>

      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-20">
        <span class="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">chat_bubble_outline</span>
        <p class="text-slate-500 dark:text-slate-400 text-sm">暂无消息</p>
      </div>
    </main>

    <ChatInputBar ref="chatInputBarRef" :is-sending="isSending" @send-text="handleSendText" @send-image="handleSendImage" />
  </div>
</template>
