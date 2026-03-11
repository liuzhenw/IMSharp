<script setup lang="ts">
interface Props {
  title: string
  showBack?: boolean
  showMenu?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBack: false,
  showMenu: false,
})

const emit = defineEmits<{
  back: []
  menu: []
}>()
</script>

<template>
  <header class="flex items-center justify-between px-4 pt-6 pb-2 bg-white dark:bg-slate-800 shrink-0">
    <button
      v-if="showBack"
      @click="emit('back')"
      class="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <span class="material-symbols-outlined">arrow_back</span>
    </button>
    <div v-else class="size-10"></div>

    <h1 class="text-2xl font-bold tracking-tight flex-1 text-center text-slate-900 dark:text-white">
      {{ title }}
    </h1>

    <button
      v-if="showMenu"
      @click="emit('menu')"
      class="flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
    >
      <span class="material-symbols-outlined">more_vert</span>
    </button>
    <div v-else class="size-10"></div>
  </header>
</template>
