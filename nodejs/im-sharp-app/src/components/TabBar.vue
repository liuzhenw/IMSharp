<script setup lang="ts">
interface Tab {
  id: string
  label: string
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="emit('update:modelValue', tab.id)"
      class="flex-1 py-3 text-center border-b-2 text-sm transition-all"
      :class="
        modelValue === tab.id
          ? 'border-primary text-primary font-bold'
          : 'border-transparent text-slate-500 dark:text-slate-400 font-medium'
      "
    >
      {{ tab.label }}
    </button>
  </div>
</template>
