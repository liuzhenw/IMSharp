<script setup lang="ts">
interface MenuItem {
  id: string
  label: string
  icon?: string
  danger?: boolean
}

interface Props {
  isOpen: boolean
  items: MenuItem[]
  position?: 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  position: 'right',
})

const emit = defineEmits<{
  select: [id: string]
  close: []
}>()

function handleSelect(id: string) {
  emit('select', id)
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-40" @click="emit('close')"></div>
  </Teleport>
  <div
    v-if="isOpen"
    :class="[
      'absolute top-full mt-2 w-40 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-1 z-50 animate-fade-in',
      position === 'right' ? 'right-0' : 'left-0',
    ]"
  >
    <button
      v-for="item in items"
      :key="item.id"
      @click="handleSelect(item.id)"
      :class="[
        'w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-medium transition-colors',
        item.danger ? 'text-danger' : 'text-slate-900 dark:text-white',
      ]"
    >
      <span v-if="item.icon" :class="['material-symbols-outlined text-xl', item.danger ? 'text-danger' : 'text-primary']">
        {{ item.icon }}
      </span>
      {{ item.label }}
    </button>
  </div>
</template>
