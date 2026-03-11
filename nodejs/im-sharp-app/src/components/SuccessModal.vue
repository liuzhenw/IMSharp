<script setup lang="ts">
interface Props {
  isOpen: boolean
  title?: string
  message: string
  buttonText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '成功',
  buttonText: '确定',
})

const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="bg-white dark:bg-slate-800 w-full max-w-xs rounded-2xl p-6 shadow-2xl animate-zoom-in text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-online/10 mb-4">
          <span class="material-symbols-outlined text-online text-4xl" style="font-variation-settings: 'FILL' 1">
            check_circle
          </span>
        </div>
        <h3 class="text-lg font-bold text-slate-900 dark:text-white mb-2">{{ title }}</h3>
        <p class="text-sm text-slate-600 dark:text-slate-400 mb-6">{{ message }}</p>
        <button
          @click="emit('close')"
          class="w-full px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm transition-colors shadow-lg shadow-primary/20"
        >
          {{ buttonText }}
        </button>
      </div>
    </div>
  </Teleport>
</template>
