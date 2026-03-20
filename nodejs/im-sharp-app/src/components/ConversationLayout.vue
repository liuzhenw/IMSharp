<script setup lang="ts">
interface Props {
  rootClass?: string
}

withDefaults(defineProps<Props>(), {
  rootClass: 'h-screen',
})
</script>

<template>
  <div
    :class="[
      'text-slate-900 dark:text-slate-100 flex flex-col relative bg-white dark:bg-slate-900',
      rootClass,
    ]"
  >
    <slot name="header" />
    <slot name="top" />
    <slot />
    <slot name="input" />
  </div>
</template>
