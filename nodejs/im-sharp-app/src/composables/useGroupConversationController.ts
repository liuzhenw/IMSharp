import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore, useChatStore, useGroupsStore, useUiStore } from '@/stores'
import { signalRService } from '@/services'
import { containsScript } from '@/utils/contentValidator'
import { useGroupConversationTimeline } from './useConversationTimeline'
import type { GroupMember, GroupMessage } from '@/types'
import type { ConversationSystemEvent } from '@/types/conversation'

export function useGroupConversationController(options: {
  groupId: string
  onIncomingMessage?: (message: GroupMessage) => void
  showReconnectToast?: boolean
  enableJoinRetry?: boolean
  joinRetryDelayMs?: number
}) {
  const chatStore = useChatStore()
  const groupsStore = useGroupsStore()
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  const isLoading = ref(true)
  const isSending = ref(false)
  const isLoadingOlder = ref(false)
  const systemEvents = ref<ConversationSystemEvent[]>([])
  let joinRetryTimer: ReturnType<typeof setTimeout> | null = null

  const group = computed(() => groupsStore.groups.find((item) => item.id === options.groupId))
  const members = computed(() => groupsStore.groupMembers.get(options.groupId) || [])
  const messages = computed(() => {
    const list = chatStore.groupMessages.get(options.groupId) || []
    return [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  })

  function resolveSenderInfo(message: GroupMessage) {
    if (message.sender) {
      return {
        displayName: message.sender.displayName || message.sender.username,
        avatar: message.sender.avatar,
      }
    }

    const senderId = message.senderId
    const member = members.value.find((item) => item.userId === senderId)
    if (member?.user) {
      return {
        displayName: member.user.displayName || member.user.username,
        avatar: member.user.avatar,
      }
    }

    const currentUser = authStore.user
    if (senderId && currentUser && currentUser.id === senderId) {
      return {
        displayName: currentUser.displayName || currentUser.username,
        avatar: currentUser.avatar,
      }
    }

    return {
      displayName: '未知用户',
      avatar: null,
    }
  }

  const timelineItems = useGroupConversationTimeline({
    messages,
    systemEvents,
    currentUserId: computed(() => authStore.user?.id),
    selfAvatar: computed(() => authStore.user?.avatar),
    resolveSenderInfo,
  })

  function pushSystemEvent(text: string, eventId: string) {
    systemEvents.value.push({
      id: eventId,
      type: 'system',
      text,
      createdAt: new Date().toISOString(),
    })
  }

  function handleMemberJoined(member: GroupMember) {
    if (member.groupId !== options.groupId) {
      return
    }

    const userId = member.userId || member.user?.id || 'unknown'
    const name = member.user?.displayName || member.user?.username || '新成员'
    pushSystemEvent(`${name} 加入了群聊`, `join-${userId}-${Date.now()}`)
  }

  function handleMemberLeft(groupId: string, userId: string) {
    if (groupId !== options.groupId) {
      return
    }

    const member = members.value.find((item) => item.userId === userId)
    const name = member?.user?.displayName || member?.user?.username || '成员'
    pushSystemEvent(`${name} 离开了群聊`, `leave-${userId}-${Date.now()}`)
  }

  async function tryJoinGroup(showRetryFeedback: boolean) {
    try {
      await signalRService.joinGroup(options.groupId)
      return true
    } catch (error) {
      console.error('[GroupConversation] 加入群组房间失败:', error)

      if (showRetryFeedback) {
        uiStore.showToast('无法接收实时消息，正在尝试重连...', 'warning')
      }

      if (options.enableJoinRetry) {
        joinRetryTimer = setTimeout(async () => {
          try {
            await signalRService.joinGroup(options.groupId)
            uiStore.showToast('已恢复实时消息接收', 'success')
          } catch (retryError) {
            console.error('[GroupConversation] 重试加入群组房间失败:', retryError)
            uiStore.showToast('无法接收实时消息，请刷新页面', 'error')
          }
        }, options.joinRetryDelayMs ?? 3000)
      }

      return false
    }
  }

  async function handleReconnected() {
    try {
      await signalRService.joinGroup(options.groupId)
      await chatStore.loadGroupMessages(options.groupId)

      if (options.showReconnectToast) {
        uiStore.showToast('连接已恢复', 'success')
      }
    } catch (error) {
      console.error('[GroupConversation] 重连后恢复群聊失败:', error)

      if (options.showReconnectToast) {
        uiStore.showToast('连接恢复失败，请刷新页面', 'error')
      }
    }
  }

  async function sendText(content: string): Promise<boolean> {
    if (containsScript(content)) {
      uiStore.showToast('消息内容包含不允许的脚本内容', 'error')
      return false
    }

    isSending.value = true

    try {
      await chatStore.sendGroupMessage(options.groupId, content)
      return true
    } catch (error) {
      console.error('发送消息失败:', error)
      uiStore.showToast('发送消息失败', 'error')
      return false
    } finally {
      isSending.value = false
    }
  }

  async function sendImage(url: string) {
    try {
      await chatStore.sendGroupMessage(options.groupId, url, 'Image')
    } catch (error) {
      console.error('发送图片失败:', error)
      uiStore.showToast('图片发送失败', 'error')
    }
  }

  const hasOlderMessages = computed(() => chatStore.canLoadOlderGroupMessages(options.groupId))

  async function loadOlderMessages() {
    if (isLoadingOlder.value || !hasOlderMessages.value) {
      return false
    }

    isLoadingOlder.value = true

    try {
      const response = await chatStore.loadOlderGroupMessages(options.groupId)
      return response.messages.length > 0
    } catch (error) {
      console.error('[GroupConversation] 加载更早群聊消息失败:', error)
      uiStore.showToast('加载历史消息失败', 'error')
      return false
    } finally {
      isLoadingOlder.value = false
    }
  }

  onMounted(async () => {
    signalRService.on('Reconnected', handleReconnected)
    signalRService.on('GroupMemberJoined', handleMemberJoined)
    signalRService.on('MemberLeftGroup', handleMemberLeft)

    try {
      chatStore.setCurrentChatId(options.groupId)

      if (!group.value) {
        await groupsStore.loadGroups()
      }

      await groupsStore.loadGroupMembers(options.groupId)
      await tryJoinGroup(Boolean(options.enableJoinRetry))
      await chatStore.loadGroupMessages(options.groupId)
      chatStore.clearUnreadCount(options.groupId)
    } catch (error) {
      console.error('[GroupConversation] 加载群聊失败:', error)
      uiStore.showToast('加载群聊失败', 'error')
    } finally {
      isLoading.value = false
    }
  })

  onUnmounted(() => {
    signalRService.off('Reconnected', handleReconnected)
    signalRService.off('GroupMemberJoined', handleMemberJoined)
    signalRService.off('MemberLeftGroup', handleMemberLeft)
    chatStore.setCurrentChatId(null)

    if (joinRetryTimer) {
      clearTimeout(joinRetryTimer)
      joinRetryTimer = null
    }
  })

  watch(messages, (newMessages, oldMessages) => {
    if (!options.onIncomingMessage) {
      return
    }

    if (newMessages.length <= (oldMessages?.length ?? 0)) {
      return
    }

    const latestMessage = newMessages[newMessages.length - 1]
    if (!latestMessage || latestMessage.senderId === authStore.user?.id) {
      return
    }

    options.onIncomingMessage(latestMessage)
  })

  return {
    group,
    members,
    messages,
    timelineItems,
    isLoading,
    isSending,
    isLoadingOlder,
    hasOlderMessages,
    sendText,
    sendImage,
    loadOlderMessages,
    resolveSenderInfo,
  }
}
