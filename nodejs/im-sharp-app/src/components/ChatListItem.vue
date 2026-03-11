<script setup lang="ts">
interface Props {
  avatar?: string
  name: string
  lastMessage?: string
  time?: string
  unreadCount?: number
  online?: boolean
  isGroup?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  lastMessage: '',
  time: '',
  unreadCount: 0,
  online: false,
  isGroup: false,
})

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <div
    @click="emit('click')"
    class="flex items-center gap-4 px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
  >
    <div class="relative shrink-0">
      <div
        v-if="avatar"
        class="size-14 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-900 shadow-sm"
        :style="{ backgroundImage: `url(${avatar})` }"
      ></div>
      <div
        v-else-if="isGroup"
        class="size-14 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-sm"
      >
        <span class="material-symbols-outlined text-white text-3xl">groups</span>
      </div>
      <div
        v-else
        class="size-14 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
      >
        <span class="material-symbols-outlined text-slate-400 text-3xl">person</span>
      </div>
      <div
        v-if="online && !isGroup"
        class="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-online"
      ></div>
    </div>

    <div class="flex flex-1 flex-col justify-center min-w-0">
      <div class="flex justify-between items-baseline">
        <p class="text-base font-semibold truncate text-slate-900 dark:text-slate-100">{{ name }}</p>
        <p
          v-if="time"
          :class="[
            'text-xs font-medium',
            unreadCount > 0 ? 'text-primary' : 'text-slate-500 dark:text-slate-400',
          ]"
        >
          {{ time }}
        </p>
      </div>
      <div class="flex justify-between items-center mt-0.5">
        <p
          :class="[
            'text-sm truncate',
            unreadCount > 0
              ? 'font-medium text-slate-700 dark:text-slate-300'
              : 'text-slate-500 dark:text-slate-400',
          ]"
        >
          {{ lastMessage || '暂无消息' }}
        </p>
        <div
          v-if="unreadCount > 0"
          class="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ml-2 shrink-0"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </div>
      </div>
    </div>
  </div>
</template>
