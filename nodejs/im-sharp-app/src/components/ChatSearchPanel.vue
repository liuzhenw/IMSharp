<script setup lang="ts">
import SearchInput from './SearchInput.vue'
import LoadingSpinner from './LoadingSpinner.vue'
import type { ConversationSearchResult } from '@/types/conversation'

interface Props {
  keyword: string
  results: ConversationSearchResult[]
  loading?: boolean
  placeholder?: string
  emptyText?: string
  idleText?: string
}

withDefaults(defineProps<Props>(), {
  loading: false,
  placeholder: '搜索聊天记录...',
  emptyText: '未找到匹配的消息',
  idleText: '输入关键词搜索聊天记录',
})

const emit = defineEmits<{
  'update:keyword': [value: string]
  select: [messageId: string]
}>()
</script>

<template>
  <div class="flex-1 bg-white dark:bg-slate-900 overflow-y-auto">
    <div
      class="bg-white dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700"
    >
      <SearchInput
        :model-value="keyword"
        :placeholder="placeholder"
        class="w-full"
        @update:model-value="emit('update:keyword', $event)"
      />
    </div>

    <div v-if="loading" class="flex items-center justify-center py-8">
      <LoadingSpinner />
    </div>

    <div v-else-if="results.length > 0" class="divide-y divide-slate-200 dark:divide-slate-800">
      <div
        v-for="result in results"
        :key="result.id"
        class="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
        @click="emit('select', result.id)"
      >
        <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">
          {{ result.title }}
        </div>
        <div class="text-slate-900 dark:text-white" v-html="result.contentHtml"></div>
        <div class="text-xs text-slate-500 dark:text-slate-500 mt-1">
          {{ result.timeLabel }}
        </div>
      </div>
    </div>

    <div
      v-else-if="keyword.trim()"
      class="flex flex-col items-center justify-center py-16 text-slate-500"
    >
      <span class="material-symbols-outlined text-6xl mb-4">search_off</span>
      <p>{{ emptyText }}</p>
    </div>

    <div v-else class="flex flex-col items-center justify-center py-16 text-slate-500">
      <span class="material-symbols-outlined text-6xl mb-4">search</span>
      <p>{{ idleText }}</p>
    </div>
  </div>
</template>
