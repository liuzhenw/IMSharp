<script setup lang="ts">
interface Props {
  modelValue: boolean
  disabled?: boolean
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  label: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <button
    @click="toggle"
    :disabled="disabled"
    class="flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <span v-if="label" class="text-slate-900 dark:text-white font-medium">{{ label }}</span>
    <div
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
      :class="modelValue ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'"
    >
      <span
        class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        :class="modelValue ? 'translate-x-6' : 'translate-x-1'"
      />
    </div>
  </button>
</template>
