<script setup lang="ts">
import { ref } from 'vue'
import ImageViewer from './ImageViewer.vue'

interface Props {
  content: string
  type?: 'Text' | 'Image' | 'File' | 'Audio' | 'Video'
  isSelf?: boolean
  time?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  avatar?: string
  senderName?: string
  showBorder?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'Text',
  isSelf: false,
  time: '',
  status: 'sent',
  avatar: '',
  senderName: '',
  showBorder: false,
})

const imageLoaded = ref(false)
const imageError = ref(false)
const showImageViewer = ref(false)

const statusIcon = {
  sending: 'schedule',
  sent: 'done',
  delivered: 'done_all',
  read: 'done_all',
  failed: 'error',
}

const statusColor = {
  sending: 'text-slate-400',
  sent: 'text-slate-400',
  delivered: 'text-slate-400',
  read: 'text-primary',
  failed: 'text-danger',
}

function handleImageLoad() {
  imageLoaded.value = true
}

function handleImageError() {
  imageError.value = true
}

function handleImageClick() {
  showImageViewer.value = true
}

function handleCloseViewer() {
  showImageViewer.value = false
}
</script>

<template>
  <div :class="['flex gap-3 mb-4', isSelf ? 'flex-row-reverse' : 'flex-row']">
    <div class="shrink-0">
      <div
        v-if="avatar"
        :class="[
          'size-10 rounded-full bg-cover bg-center',
          showBorder ? (isSelf ? 'border border-primary/20' : 'border border-slate-200 dark:border-slate-700') : ''
        ]"
        :style="{ backgroundImage: `url(${avatar})` }"
      ></div>
      <div
        v-else
        :class="[
          'size-10 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center shadow-sm',
          showBorder ? (isSelf ? 'border border-primary/20' : 'border border-slate-200 dark:border-slate-700') : ''
        ]"
      >
        <span class="material-symbols-outlined text-white text-xl">person</span>
      </div>
    </div>

    <div :class="['flex flex-col max-w-[70%]', isSelf ? 'items-end' : 'items-start']">
      <!-- 发送者昵称（群聊场景，非自己的消息才显示） -->
      <span
        v-if="senderName && !isSelf"
        class="text-slate-500 dark:text-slate-400 text-xs font-medium ml-1 mb-1"
      >
        {{ senderName }}
      </span>

      <!-- 文本消息 -->
      <div
        v-if="type === 'Text'"
        :class="[
          'px-4 py-2.5 rounded-2xl break-words',
          isSelf
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm',
        ]"
      >
        <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ content }}</p>
      </div>

      <!-- 图片消息 -->
      <div
        v-else-if="type === 'Image'"
        :class="[
          'rounded-2xl overflow-hidden',
          isSelf ? 'rounded-tr-sm' : 'rounded-tl-sm',
        ]"
      >
        <!-- 图片加载中 -->
        <div
          v-if="!imageLoaded && !imageError"
          class="w-40 h-40 bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
        >
          <span class="material-symbols-outlined text-4xl text-slate-400 animate-spin">progress_activity</span>
        </div>

        <!-- 图片加载失败 -->
        <div
          v-else-if="imageError"
          :class="[
            'w-40 h-40 flex flex-col items-center justify-center gap-2',
            isSelf
              ? 'bg-primary/10 text-primary'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-500',
          ]"
        >
          <span class="material-symbols-outlined text-4xl">broken_image</span>
          <p class="text-xs">图片加载失败</p>
        </div>

        <!-- 图片显示 -->
        <img
          v-show="imageLoaded && !imageError"
          :src="content"
          :alt="'图片消息'"
          class="max-w-[200px] max-h-[200px] object-contain cursor-pointer hover:opacity-90 transition-opacity"
          @load="handleImageLoad"
          @error="handleImageError"
          @click="handleImageClick"
        />
      </div>

      <!-- 其他类型消息 (暂不支持) -->
      <div
        v-else
        :class="[
          'px-4 py-2.5 rounded-2xl',
          isSelf
            ? 'bg-primary/10 text-primary rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-tl-sm',
        ]"
      >
        <p class="text-sm">不支持的消息类型: {{ type }}</p>
      </div>

      <div :class="['flex items-center gap-1 mt-1 px-1', isSelf ? 'flex-row-reverse' : 'flex-row']">
        <span v-if="time" class="text-xs text-slate-400">{{ time }}</span>
        <span
          v-if="isSelf && status"
          :class="['material-symbols-outlined text-xs', statusColor[status]]"
        >
          {{ statusIcon[status] }}
        </span>
      </div>
    </div>
  </div>

  <!-- 图片查看器 -->
  <ImageViewer
    :is-open="showImageViewer"
    :image-url="content"
    @close="handleCloseViewer"
  />
</template>
