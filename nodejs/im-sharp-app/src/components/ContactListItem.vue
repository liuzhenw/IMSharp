<script setup lang="ts">
interface Props {
  avatar?: string
  name: string
  status?: string
  online?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  avatar: '',
  status: '',
  online: false,
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
        class="size-12 rounded-full bg-cover bg-center border-2 border-white dark:border-slate-900 shadow-sm"
        :style="{ backgroundImage: `url(${avatar})` }"
      ></div>
      <div
        v-else
        class="size-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm"
      >
        <span class="material-symbols-outlined text-slate-400 text-2xl">person</span>
      </div>
      <div
        v-if="online"
        class="absolute bottom-0 right-0 size-3 rounded-full border-2 border-white dark:border-slate-900 bg-online"
      ></div>
    </div>

    <div class="flex flex-1 flex-col justify-center min-w-0">
      <p class="text-base font-semibold truncate text-slate-900 dark:text-slate-100">{{ name }}</p>
      <p v-if="status" class="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5">
        {{ status }}
      </p>
    </div>

    <span class="material-symbols-outlined text-slate-400 text-xl">chevron_right</span>
  </div>
</template>
