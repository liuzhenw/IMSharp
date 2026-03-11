<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore } from '@/stores'
import { Header, SearchInput, ChatListItem, BottomNav } from '@/components'

const router = useRouter()
const groupsStore = useGroupsStore()
const searchQuery = ref('')

onMounted(async () => {
  await groupsStore.loadGroups()
})

function handleCreateGroup() {
  // TODO: 跳转到创建群组页面
  console.log('创建群组')
}

function handleGroupClick(groupId: string) {
  router.push(`/groups/${groupId}`)
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <Header title="群组" :show-add="true" add-icon="group_add" @add="handleCreateGroup" />

    <div class="px-4 py-3 bg-white dark:bg-slate-900">
      <SearchInput v-model="searchQuery" placeholder="搜索群组..." />
    </div>

    <div class="flex-1 overflow-y-auto pb-20 bg-slate-50 dark:bg-slate-900/50">
      <p class="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
        暂无群组
      </p>
      <!-- 示例数据 -->
      <!-- <ChatListItem
        v-for="group in filteredGroups"
        :key="group.id"
        :avatar="group.avatar"
        :name="group.name"
        :last-message="group.lastMessage"
        :time="group.time"
        :unread-count="group.unreadCount"
        :is-group="true"
        @click="handleGroupClick(group.id)"
      /> -->
    </div>

    <BottomNav />
  </div>
</template>
