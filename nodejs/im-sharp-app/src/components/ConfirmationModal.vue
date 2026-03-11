<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'primary' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  confirmText: '确定',
  cancelText: '取消',
  variant: 'primary',
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      @click.self="emit('cancel')"
    >
      <div class="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-zoom-in">
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">{{ message }}</p>
        <div class="flex gap-3">
          <button
            @click="emit('cancel')"
            class="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="emit('confirm')"
            :class="[
              'flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg',
              variant === 'danger'
                ? 'bg-danger hover:bg-danger/90 text-white shadow-danger/20'
                : 'bg-primary hover:bg-primary/90 text-white shadow-primary/20',
            ]"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
