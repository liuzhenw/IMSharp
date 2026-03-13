<script setup lang="ts">
import { ref } from 'vue'
import { EmojiPicker } from '@/components'
import { mediaApi } from '@/services/api'
import { useUiStore } from '@/stores'

interface Props {
  isSending?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isSending: false
})

const emit = defineEmits<{
  sendText: [content: string]
  sendImage: [url: string]
}>()

const uiStore = useUiStore()
const messageInput = ref('')
const isUploading = ref(false)
const showEmojiPicker = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function handleSendMessage() {
  if (!messageInput.value.trim() || props.isSending) return
  const content = messageInput.value.trim()
  emit('sendText', content)
}

// 清空输入框（供父组件调用）
function clearInput() {
  messageInput.value = ''
}

// 暴露方法给父组件
defineExpose({
  clearInput
})

function handleEmojiSelect(emoji: string) {
  messageInput.value += emoji
}

function handleImageUpload() {
  fileInputRef.value?.click()
}

async function uploadImage(file: File) {
  isUploading.value = true
  try {
    const result = await mediaApi.upload(file)
    emit('sendImage', result.url)
  } catch (error) {
    console.error('图片上传失败:', error)
    uiStore.showToast('图片上传失败', 'error')
  } finally {
    isUploading.value = false
  }
}

async function handleFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(e.target as HTMLInputElement).value = ''

  await uploadImage(file)
}

async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  // 查找图片项
  const imageItems = Array.from(items).filter(item =>
    item.type.startsWith('image/')
  )

  if (imageItems.length === 0) return

  // 阻止默认粘贴行为（防止图片作为文本插入）
  e.preventDefault()

  // 处理所有图片
  for (const item of imageItems) {
    const file = item.getAsFile()
    if (file) {
      await uploadImage(file)
    }
  }
}
</script>

<template>
  <footer class="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800 p-3 pb-8 z-10">
    <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />

    <EmojiPicker :is-open="showEmojiPicker" @select="handleEmojiSelect" @close="showEmojiPicker = false" />

    <div class="flex items-stretch gap-2 max-w-4xl mx-auto">
      <!-- 图片上传按钮（左侧） -->
      <button
        @click="handleImageUpload"
        :disabled="isUploading"
        class="p-2 flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0 self-center"
        :title="isUploading ? '上传中...' : '发送图片'"
      >
        <span v-if="isUploading" class="material-symbols-outlined text-2xl animate-spin">progress_activity</span>
        <span v-else class="material-symbols-outlined text-2xl">image</span>
      </button>

      <!-- 输入框 -->
      <div class="flex-1 relative">
        <input
          v-model="messageInput"
          @focus="showEmojiPicker = false"
          @keyup.enter="handleSendMessage"
          @paste="handlePaste"
          :disabled="props.isSending"
          maxlength="1000"
          class="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-full py-2.5 px-4 pr-12 text-base focus:ring-2 focus:ring-primary/50 transition-all text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder="输入消息..."
          type="text"
        />
        <button
          @click="showEmojiPicker = !showEmojiPicker"
          :disabled="props.isSending"
          class="absolute right-3 top-1/2 -translate-y-1/2 transition-colors disabled:opacity-50"
          :class="showEmojiPicker ? 'text-primary' : 'text-slate-500 hover:text-primary'"
        >
          <span class="material-symbols-outlined text-2xl">sentiment_satisfied</span>
        </button>
      </div>

      <!-- 发送按钮（右侧，扁平设计） -->
      <button
        v-if="messageInput.trim() || props.isSending"
        @click="handleSendMessage"
        :disabled="props.isSending"
        class="px-5 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0 self-center"
        style="height: 2.6rem"
      >
        <span v-if="props.isSending" class="material-symbols-outlined text-xl animate-spin">progress_activity</span>
        <span v-else class="material-symbols-outlined text-xl">send</span>
      </button>
    </div>
  </footer>
</template>