<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore, useContactsStore, useGroupsStore } from '@/stores'
import { Badge } from '@/components'

const route = useRoute()
const chatStore = useChatStore()
const contactsStore = useContactsStore()
const groupsStore = useGroupsStore()

const tabs = [
  { id: 'chats', icon: 'chat_bubble', label: '消息', path: '/chats' },
  { id: 'contacts', icon: 'contact_page', label: '通讯录', path: '/contacts' },
  { id: 'profile', icon: 'person', label: '我', path: '/profile' },
]

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/chats') || path === '/') return 'chats'
  if (path.startsWith('/contacts')) return 'contacts'
  if (path.startsWith('/profile')) return 'profile'
  return ''
})

const contactsPendingCount = computed(
  () => contactsStore.pendingRequestsCount + groupsStore.totalPendingRequestsCount
)
</script>

<template>
  <nav
    class="fixed bottom-0 left-0 w-full border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2 pb-6 pt-2 z-50"
  >
    <div class="flex justify-around items-center max-w-2xl mx-auto">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.path"
        class="flex flex-1 flex-col items-center justify-center gap-1 transition-colors"
        :class="activeTab === tab.id ? 'text-primary' : 'text-slate-400 dark:text-slate-500'"
      >
        <div class="relative flex h-8 items-center justify-center">
          <span
            class="material-symbols-outlined text-2xl"
            :style="{ fontVariationSettings: activeTab === tab.id ? `'FILL' 1` : `'FILL' 0` }"
          >
            {{ tab.icon }}
          </span>
          <!-- 未读消息徽章 -->
          <Badge
            v-if="tab.id === 'chats' && chatStore.totalUnreadCount > 0"
            :count="chatStore.totalUnreadCount"
            class="absolute -top-1 -right-2"
          />
          <!-- 好友请求徽章 -->
          <Badge
            v-if="tab.id === 'contacts' && contactsPendingCount > 0"
            :count="contactsPendingCount"
            class="absolute -top-1 -right-2"
          />
        </div>
        <p class="text-[10px] font-bold leading-none uppercase tracking-wider">{{ tab.label }}</p>
      </RouterLink>
    </div>
  </nav>
</template>
