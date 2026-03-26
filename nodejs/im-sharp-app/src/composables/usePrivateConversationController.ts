import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAuthStore, useChatStore, useContactsStore, useUiStore } from '@/stores'
import { signalRService } from '@/services'
import { containsScript } from '@/utils/contentValidator'
import { debounce } from '@/utils/debounce'
import { usePrivateConversationTimeline } from './useConversationTimeline'
import type { PrivateMessage } from '@/types'

export function usePrivateConversationController(options: {
  chatId: string
  onIncomingMessage?: (message: PrivateMessage) => void
}) {
  const chatStore = useChatStore()
  const contactsStore = useContactsStore()
  const authStore = useAuthStore()
  const uiStore = useUiStore()

  const isLoading = ref(true)
  const isSending = ref(false)
  const isLoadingOlder = ref(false)

  const chatUser = computed(() =>
    contactsStore.friends.find((friend) => friend.id === options.chatId),
  )
  const messages = computed(() => {
    const list = chatStore.privateMessages.get(options.chatId) || []
    return [...list].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  })
  const isTyping = computed(() => chatStore.typingUsers.get(options.chatId) || false)
  const isFriendDeleted = computed(() => chatStore.deletedFriendId === options.chatId)

  const timelineItems = usePrivateConversationTimeline({
    messages,
    currentUserId: computed(() => authStore.user?.id),
    selfAvatar: computed(() => authStore.user?.avatar),
    otherAvatar: computed(() => chatUser.value?.avatar),
  })

  const notifyTyping = debounce(async () => {
    try {
      await signalRService.sendTypingStatus(options.chatId)
    } catch (error) {
      console.debug('发送输入状态失败:', error)
    }
  }, 300)

  async function handleReconnected() {
    try {
      await chatStore.loadPrivateMessages(options.chatId)
    } catch (error) {
      console.error('重连后恢复私聊失败:', error)
    }
  }

  async function sendText(content: string): Promise<boolean> {
    if (containsScript(content)) {
      uiStore.showToast('消息内容包含不允许的脚本内容', 'error')
      return false
    }

    isSending.value = true

    try {
      await chatStore.sendPrivateMessage(options.chatId, content)
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
      await chatStore.sendPrivateMessage(options.chatId, url, 'Image')
    } catch (error) {
      console.error('发送图片失败:', error)
      uiStore.showToast('图片发送失败', 'error')
    }
  }

  function handleInputChange(content: string) {
    if (!content.trim()) {
      return
    }

    notifyTyping()
  }

  function clearDeletedFriendNotification() {
    chatStore.clearDeletedFriendNotification()
  }

  const hasOlderMessages = computed(() => chatStore.canLoadOlderPrivateMessages(options.chatId))

  async function loadOlderMessages() {
    if (isLoadingOlder.value || !hasOlderMessages.value) {
      return false
    }

    isLoadingOlder.value = true

    try {
      const response = await chatStore.loadOlderPrivateMessages(options.chatId)
      return response.messages.length > 0
    } catch (error) {
      console.error('加载更早私聊消息失败:', error)
      uiStore.showToast('加载历史消息失败', 'error')
      return false
    } finally {
      isLoadingOlder.value = false
    }
  }

  onMounted(async () => {
    signalRService.on('Reconnected', handleReconnected)

    try {
      chatStore.setCurrentChatId(options.chatId)

      if (!chatUser.value) {
        await contactsStore.loadFriends()
      }

      await chatStore.loadPrivateMessages(options.chatId)
      await chatStore.markAllAsRead(options.chatId)
    } catch (error) {
      console.error('加载聊天失败:', error)
    } finally {
      isLoading.value = false
    }
  })

  onUnmounted(() => {
    signalRService.off('Reconnected', handleReconnected)
    chatStore.setCurrentChatId(null)
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
    chatUser,
    messages,
    timelineItems,
    isLoading,
    isSending,
    isLoadingOlder,
    isTyping,
    isFriendDeleted,
    hasOlderMessages,
    sendText,
    sendImage,
    handleInputChange,
    clearDeletedFriendNotification,
    loadOlderMessages,
  }
}
