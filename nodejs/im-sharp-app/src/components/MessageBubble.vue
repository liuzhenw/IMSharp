<script setup lang="ts">
interface Props {
  content: string
  isSelf?: boolean
  time?: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  avatar?: string
}

const props = withDefaults(defineProps<Props>(), {
  isSelf: false,
  time: '',
  status: 'sent',
  avatar: '',
})

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
</script>

<template>
  <div :class="['flex gap-3 mb-4', isSelf ? 'flex-row-reverse' : 'flex-row']">
    <div class="shrink-0">
      <div
        v-if="avatar"
        class="size-10 rounded-full bg-cover bg-center"
        :style="{ backgroundImage: `url(${avatar})` }"
      ></div>
      <div
        v-else
        class="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
      >
        <span class="material-symbols-outlined text-slate-400 text-xl">person</span>
      </div>
    </div>

    <div :class="['flex flex-col max-w-[70%]', isSelf ? 'items-end' : 'items-start']">
      <div
        :class="[
          'px-4 py-2.5 rounded-2xl break-words',
          isSelf
            ? 'bg-primary text-white rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-sm',
        ]"
      >
        <p class="text-sm leading-relaxed whitespace-pre-wrap">{{ content }}</p>
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
</template>
