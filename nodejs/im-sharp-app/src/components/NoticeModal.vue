<script setup lang="ts">
interface Props {
  isOpen: boolean
  title: string
  content: string
  time?: string
}

const props = withDefaults(defineProps<Props>(), {
  time: '',
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
      <div class="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl animate-zoom-in overflow-hidden">
        <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <h3 class="text-lg font-bold text-slate-900 dark:text-white">{{ title }}</h3>
          <button
            @click="emit('close')"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span class="material-symbols-outlined text-2xl">close</span>
          </button>
        </div>
        <div class="px-6 py-4 max-h-96 overflow-y-auto">
          <p v-if="time" class="text-xs text-slate-400 mb-3">{{ time }}</p>
          <div class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {{ content }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
