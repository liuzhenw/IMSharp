<script setup lang="ts">
interface Props {
  content: string
  closable?: boolean
  variant?: 'info' | 'warning' | 'success' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  closable: false,
  variant: 'info',
})

const emit = defineEmits<{
  close: []
}>()

const variantClasses = {
  info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  success: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  danger: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
}

const iconMap = {
  info: 'info',
  warning: 'warning',
  success: 'check_circle',
  danger: 'error',
}
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 px-4 py-3 rounded-xl border',
      variantClasses[variant],
    ]"
  >
    <span class="material-symbols-outlined text-xl shrink-0">{{ iconMap[variant] }}</span>
    <p class="flex-1 text-sm font-medium">{{ content }}</p>
    <button
      v-if="closable"
      @click="emit('close')"
      class="shrink-0 hover:opacity-70 transition-opacity"
    >
      <span class="material-symbols-outlined text-xl">close</span>
    </button>
  </div>
</template>
