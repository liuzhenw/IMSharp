<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '搜索...',
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

function handleSearch() {
  emit('search', props.modelValue)
}
</script>

<template>
  <div class="flex w-full items-center rounded-xl bg-slate-200/50 dark:bg-slate-800/50 px-4 py-2.5">
    <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">search</span>
    <input
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keyup.enter="handleSearch"
      class="flex w-full border-none bg-transparent focus:outline-0 focus:ring-0 text-sm placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white"
      type="text"
    />
    <button
      v-if="modelValue"
      @click="emit('update:modelValue', '')"
      class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
    >
      <span class="material-symbols-outlined text-xl">close</span>
    </button>
  </div>
</template>
