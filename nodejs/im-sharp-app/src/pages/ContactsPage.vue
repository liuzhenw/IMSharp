<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useContactsStore } from '@/stores'
import { Header, SearchInput, TabBar, ContactListItem, BottomNav, Badge } from '@/components'

const router = useRouter()
const contactsStore = useContactsStore()
const searchQuery = ref('')
const view = ref<'friends' | 'groups'>('friends')

const tabs = [
  { id: 'friends', label: '好友' },
  { id: 'groups', label: '群组' },
]

const pendingRequestsCount = computed(() =>
  contactsStore.receivedRequests.filter(r => r.status === 'Pending').length
)

const filteredFriends = computed(() => {
  if (!searchQuery.value) return contactsStore.friends
  const query = searchQuery.value.toLowerCase()
  return contactsStore.friends.filter(
    f => f.displayName.toLowerCase().includes(query) || f.username.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  await contactsStore.loadFriends()
  await contactsStore.loadReceivedRequests()
})

function handleAddClick() {
  if (view.value === 'friends') {
    router.push('/contacts/add')
  } else {
    router.push('/groups')
  }
}

function handleContactClick(contactId: string) {
  router.push(`/contacts/${contactId}`)
}

function handleRequestsClick() {
  router.push('/contacts/requests')
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <header class="flex items-center justify-between px-4 pt-6 pb-2 shrink-0 bg-white dark:bg-slate-800">
      <div class="size-10"></div>
      <h1 class="text-2xl font-bold tracking-tight flex-1 text-center text-slate-900 dark:text-white">通讯录</h1>
      <button
        @click="handleAddClick"
        class="flex items-center gap-4 justify-end size-10 transition-all"
      >
        <span class="material-symbols-outlined text-primary">
          {{ view === 'friends' ? 'person_add' : 'group_add' }}
        </span>
      </button>
    </header>

    <div class="px-4 py-3 bg-white dark:bg-slate-900">
      <SearchInput
        v-model="searchQuery"
        :placeholder="view === 'friends' ? '搜索好友...' : '搜索群组...'"
      />
    </div>

    <TabBar v-model="view" :tabs="tabs" />

    <div class="flex-1 overflow-y-auto hide-scrollbar bg-slate-50 dark:bg-slate-900/50 pb-20">
      <!-- 好友请求入口 -->
      <div
        v-if="view === 'friends' && pendingRequestsCount > 0"
        @click="handleRequestsClick"
        class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <div class="size-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-2xl">person_add</span>
        </div>
        <div class="flex-1">
          <p class="font-semibold text-slate-900 dark:text-white">好友请求</p>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ pendingRequestsCount }} 条待处理</p>
        </div>
        <Badge :count="pendingRequestsCount" />
        <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
      </div>

      <!-- 好友列表 -->
      <template v-if="view === 'friends'">
        <ContactListItem
          v-for="friend in filteredFriends"
          :key="friend.id"
          :avatar="friend.avatar || undefined"
          :name="friend.displayName || friend.username"
          :status="friend.remark || ''"
          :online="friend.isOnline"
          @click="handleContactClick(friend.id)"
        />
        <p v-if="filteredFriends.length === 0" class="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
          {{ searchQuery ? '未找到匹配的好友' : '暂无好友' }}
        </p>
      </template>

      <!-- 群组列表 -->
      <template v-else>
        <p class="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
          暂无群组
        </p>
      </template>
    </div>

    <BottomNav />
  </div>
</template>
