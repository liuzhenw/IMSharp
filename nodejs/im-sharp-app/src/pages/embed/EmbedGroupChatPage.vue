<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChatStore, useGroupsStore, useAuthStore, useUiStore } from '@/stores'
import { useEmbedStore } from '@/stores/embed'
import { MessageBubble, LoadingSpinner, ChatInputBar } from '@/components'
import { containsScript } from '@/utils/contentValidator'
import { formatTime, formatDate } from '@/utils/time'
import { signalRService } from '@/services'
import type { GroupMessage, GroupMember } from '@/types'

interface SystemEvent {
  id: string
  type: 'system'
  text: string
  createdAt: string
}

const route = useRoute()
const router = useRouter()
const chatStore = useChatStore()
const groupsStore = useGroupsStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const embedStore = useEmbedStore()

const groupId = route.params.id as string
const messagesContainer = ref<HTMLElement | null>(null)
const chatInputBarRef = ref<InstanceType<typeof ChatInputBar> | null>(null)
const isLoading = ref(true)
const isSending = ref(false)
const systemEvents = ref<SystemEvent[]>([])

const group = computed(() => groupsStore.groups.find(g => g.id === groupId))
const members = computed(() => groupsStore.groupMembers.get(groupId) || [])

const messages = computed(() => {
  const msgs = chatStore.groupMessages.get(groupId) || []
  return [...msgs].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

const allItems = computed(() => {
  const msgs = messages.value.map(m => ({ ...m, type: m.type as string }))
  return [...msgs, ...systemEvents.value].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )
})

function handleMemberJoined(member: GroupMember) {
  if (member.groupId !== groupId) return
  const name = member.user?.displayName || member.user?.username || '新成员'
  systemEvents.value.push({
    id: `join-${member.userId}-${Date.now()}`,
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
  try {
    await signalRService.joinGroup(groupId)
    await chatStore.loadGroupMessages(groupId)
  } catch (error) {
    console.error('[EmbedGroupChatPage] 重连后恢复群聊失败:', error)
  }
}

onMounted(async () => {
  signalRService.on('Reconnected', handleReconnected)
  signalRService.on('GroupMemberJoined', handleMemberJoined)
  signalRService.on('MemberLeftGroup', handleMemberLeft)

  try {
    chatStore.setCurrentChatId(groupId)
    if (!group.value) {
      await groupsStore.loadGroups()
    }
    await groupsStore.loadGroupMembers(groupId)
    await signalRService.joinGroup(groupId)
    await chatStore.loadGroupMessages(groupId)
    chatStore.clearUnreadCount(groupId)
  } catch (error) {
    console.error('[EmbedGroupChatPage] 加载群聊失败:', error)
    uiStore.showToast('加载群聊失败', 'error')
  } finally {
    isLoading.value = false
    await nextTick()
    scrollToBottom()
  }
})

onUnmounted(() => {
  signalRService.off('Reconnected', handleReconnected)
  signalRService.off('GroupMemberJoined', handleMemberJoined)
  signalRService.off('MemberLeftGroup', handleMemberLeft)
  chatStore.setCurrentChatId(null)
})

watch(allItems, async (newItems, oldItems) => {
  await nextTick()
  scrollToBottom()
  // 通知父页面新消息
  if (newItems.length > (oldItems?.length ?? 0)) {
    const latest = newItems[newItems.length - 1]
    if (latest && latest.type !== 'system' && (latest as any).senderId !== authStore.user?.id) {
      embedStore.notifyParent('new-message', {
        id: latest.id,
        content: (latest as any).content,
        senderId: (latest as any).senderId,
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
    await chatStore.sendGroupMessage(groupId, content)
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
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
      }
    })
  })
}

function shouldShowTimestamp(index: number): boolean {
  const item = allItems.value[index]
  if (!item || item.type === 'system') return false
  if (index === 0) return true
  let prevIndex = index - 1
  while (prevIndex >= 0 && allItems.value[prevIndex]?.type === 'system') prevIndex--
  if (prevIndex < 0) return true
  const prevItem = allItems.value[prevIndex]
  if (!prevItem) return false
  return new Date(item.createdAt).getTime() - new Date(prevItem.createdAt).getTime() > 5 * 60 * 1000
}

function getSenderInfo(message: GroupMessage) {
  if (message.sender) {
    return { displayName: message.sender.displayName || message.sender.username, avatar: message.sender.avatar }
  }
  const senderId = message.senderId || (message as any).sender?.id
  const member = members.value.find(m => m.userId === senderId)
  if (member?.user) {
    return { displayName: member.user.displayName || member.user.username, avatar: member.user.avatar }
  }
  if (senderId && authStore.user && senderId === authStore.user.id) {
    return { displayName: authStore.user.displayName || authStore.user.username, avatar: authStore.user.avatar }
  }
  return { displayName: '未知用户', avatar: null }
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
        <h2 class="text-base font-semibold truncate">{{ group?.name || '群聊' }}</h2>
        <span class="text-xs text-slate-400">{{ group?.memberCount }} 人</span>
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
      <template v-if="allItems.length > 0">
        <template v-for="(item, index) in allItems" :key="item.id">
          <div v-if="item.type === 'system'" class="flex justify-center">
            <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              {{ (item as any).text }}
            </span>
          </div>
          <template v-else>
            <div v-if="shouldShowTimestamp(index)" class="flex justify-center">
              <span class="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                {{ formatDate(item.createdAt) }} {{ formatTime(item.createdAt) }}
              </span>
            </div>
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
            />
          </template>
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
