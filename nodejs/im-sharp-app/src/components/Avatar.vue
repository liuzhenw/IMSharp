<script setup lang="ts">
interface Props {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  src: '',
  alt: '',
  size: 'md',
  online: false,
})

const sizeClasses = {
  sm: 'size-8',
  md: 'size-12',
  lg: 'size-16',
  xl: 'size-24',
}

const onlineDotSize = {
  sm: 'size-2',
  md: 'size-3',
  lg: 'size-3.5',
  xl: 'size-4',
}
</script>

<template>
  <div class="relative inline-block">
    <div
      v-if="src"
      :class="[
        'rounded-full bg-cover bg-center border-2 border-white dark:border-slate-900 shadow-sm',
        sizeClasses[size],
      ]"
      :style="{ backgroundImage: `url(${src})` }"
      :aria-label="alt"
    ></div>
    <div
      v-else
      :class="[
        'rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm',
        sizeClasses[size],
      ]"
    >
      <span class="material-symbols-outlined text-slate-400" :class="size === 'sm' ? 'text-base' : size === 'md' ? 'text-2xl' : size === 'lg' ? 'text-3xl' : 'text-5xl'">
        person
      </span>
    </div>
    <div
      v-if="online"
      :class="[
        'absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-slate-900 bg-online',
        onlineDotSize[size],
      ]"
    ></div>
  </div>
</template>
