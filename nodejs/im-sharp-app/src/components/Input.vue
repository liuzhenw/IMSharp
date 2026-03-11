<script setup lang="ts">
interface Props {
  modelValue: string
  type?: 'text' | 'password' | 'email' | 'number' | 'tel'
  placeholder?: string
  disabled?: boolean
  error?: string
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  placeholder: '',
  disabled: false,
  error: '',
  label: '',
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
    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :class="[
        'w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/50 shadow-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400',
        error ? 'ring-2 ring-danger' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
    />
    <p v-if="error" class="text-xs text-danger ml-1">{{ error }}</p>
  </div>
</template>
