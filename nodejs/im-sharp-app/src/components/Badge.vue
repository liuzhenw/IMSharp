<script setup lang="ts">
interface Props {
  count?: number
  max?: number
  dot?: boolean
  variant?: 'primary' | 'danger' | 'success'
}

const props = withDefaults(defineProps<Props>(), {
  count: 0,
  max: 99,
  dot: false,
  variant: 'primary',
})

const variantClasses = {
  primary: 'bg-primary',
  danger: 'bg-danger',
  success: 'bg-online',
}

const displayCount = props.count > props.max ? `${props.max}+` : props.count
</script>

<template>
  <span
    v-if="dot || count > 0"
    :class="[
      'inline-flex items-center justify-center text-white font-bold',
      variantClasses[variant],
      dot ? 'size-2 rounded-full' : 'min-w-5 h-5 px-1.5 rounded-full text-[10px]',
    ]"
  >
    <template v-if="!dot">{{ displayCount }}</template>
  </span>
</template>
