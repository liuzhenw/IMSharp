<script setup lang="ts">
import { computed } from 'vue'

export interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const props = withDefaults(defineProps<ToastProps>(), {
  type: 'info',
  duration: 3000,
})

const emit = defineEmits<{
  close: []
}>()

const iconMap = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

const colorMap = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
}

const icon = computed(() => iconMap[props.type])
const bgColor = computed(() => colorMap[props.type])
</script>

<template>
  <div
    class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-2 duration-300"
  >
    <div
      class="flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/20"
      :class="bgColor"
    >
      <span class="material-symbols-outlined text-white text-xl">{{ icon }}</span>
      <p class="text-sm font-medium text-white max-w-xs">{{ message }}</p>
      <button
        @click="emit('close')"
        class="text-white/80 hover:text-white transition-colors"
      >
        <span class="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  </div>
</template>
