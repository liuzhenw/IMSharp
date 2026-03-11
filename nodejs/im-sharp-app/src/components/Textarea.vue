<script setup lang="ts">
interface Props {
  modelValue: string
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
  rows: 3,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div class="space-y-2">
    <label v-if="label" class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
      {{ label }}
    </label>
    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      :class="[
        'w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50 shadow-sm transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400',
        error ? 'ring-2 ring-danger' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
    ></textarea>
    <p v-if="error" class="text-xs text-danger ml-1">{{ error }}</p>
  </div>
</template>
