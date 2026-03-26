<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore, useChatStore, useUiStore, useAuthStore } from '@/stores'
import { Header, SearchInput, ChatListItem, BottomNav } from '@/components'
import type { SearchGroupResponse } from '@/types'
import { formatConversationTime } from '@/utils/time'

const router = useRouter()
const groupsStore = useGroupsStore()
const chatStore = useChatStore()
const uiStore = useUiStore()
const authStore = useAuthStore()
const searchQuery = ref('')
const isSearching = ref(false)
const searchResult = ref<SearchGroupResponse | null>(null)

onMounted(async () => {
  await groupsStore.loadGroups()
})

// 判断是否是纯数字
const isNumericSearch = computed(() => {
  return /^\d+$/.test(searchQuery.value.trim())
})

// 过滤群组列表（本地搜索）
const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return groupsStore.groups
  }
  if (isNumericSearch.value) {
    return groupsStore.groups
  }
  const query = searchQuery.value.toLowerCase()
  return groupsStore.groups.filter(group =>
    group.name.toLowerCase().includes(query)
  )
})

// 监听搜索输入清空，清空搜索结果
watch(searchQuery, (newValue) => {
  if (!newValue.trim()) {
    searchResult.value = null
  }
})

// 手动触发搜索
async function handleSearch() {
  if (!searchQuery.value.trim()) {
    return
  }

  if (isNumericSearch.value) {
    // 纯数字：远程搜索
    await performRemoteSearch(parseInt(searchQuery.value.trim()))
  }
  // 文字搜索：filteredGroups 会自动重新计算
}

// 执行远程搜索
async function performRemoteSearch(groupNumber: number) {
  isSearching.value = true
  try {
    const result = await groupsStore.searchGroupByNumber(groupNumber)
    searchResult.value = result
  } catch (error: any) {
    console.error('Search group failed:', error)
    searchResult.value = null
    if (error.response?.status === 404) {
      uiStore.showToast('未找到该群组', 'error')
    } else {
      uiStore.showToast('搜索失败', 'error')
    }
  } finally {
    isSearching.value = false
  }
}

// 加入群组或发送入群申请
async function handleJoinGroup(group: SearchGroupResponse['group']) {
  try {
    if (group.isPublic) {
      // 公开群组：直接加入
      await groupsStore.joinGroup(group.groupNumber)
      uiStore.showToast('加入成功', 'success')
      searchResult.value = null
      searchQuery.value = ''
    } else {
      // 非公开群组：发送入群申请
      await groupsStore.sendJoinRequest(group.groupNumber)
      uiStore.showToast('已发送入群申请', 'success')
    }
  } catch (error) {
    console.error('Join group failed:', error)
    uiStore.showToast(group.isPublic ? '加入失败' : '发送申请失败', 'error')
  }
}

// 获取群组的最后一条消息
function getLastMessage(groupId: string) {
  const messages = chatStore.groupMessages.get(groupId)
  if (!messages || messages.length === 0) return null

  // 获取最新的消息
  const sortedMessages = [...messages].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const lastMsg = sortedMessages[0]
  if (!lastMsg) return null

  // 格式化消息内容
  if (lastMsg.type === 'Image') {
    return '[图片]'
  } else if (lastMsg.type === 'Text') {
    return lastMsg.content
  } else {
    return `[${lastMsg.type}]`
  }
}

// 获取群组的最后消息时间
function getLastMessageTime(groupId: string) {
  const messages = chatStore.groupMessages.get(groupId)
  if (!messages || messages.length === 0) return null

  const sortedMessages = [...messages].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return sortedMessages[0]?.createdAt || null
}

// 获取未读数
function getUnreadCount(groupId: string) {
  return chatStore.unreadCounts[groupId] || 0
}

function handleCreateGroup() {
  router.push('/groups/create')
}

function handleGroupClick(groupId: string) {
  router.push(`/groups/${groupId}/chat`)
}

function handleMyJoinRequestsClick() {
  router.push('/groups/my-join-requests')
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden">
    <Header title="搜索群聊" :show-back="true" @back="router.push('/chats')" right-icon="primary:person_add" @right="router.push('/contacts/add')" />

    <div class="px-4 py-3 bg-white dark:bg-slate-900">
      <div class="flex w-full items-center rounded-xl bg-slate-200/50 dark:bg-slate-800/50 px-4 h-11">
        <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">search</span>
        <input
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          class="flex w-full border-none bg-transparent focus:outline-0 focus:ring-0 text-base placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white"
          :placeholder="isNumericSearch ? '输入群号搜索...' : '搜索群组...'"
          type="text"
        />
        <button
          v-if="searchQuery.trim()"
          @click="handleSearch"
          class="ml-2 size-9 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors shrink-0 shadow-sm flex items-center justify-center"
          type="button"
        >
          <span class="material-symbols-outlined text-xl">arrow_forward</span>
        </button>
      </div>
      <p class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        输入群号搜索公开群组
      </p>
    </div>

    <div class="flex-1 overflow-y-auto pb-20 bg-slate-50 dark:bg-slate-900">
      <!-- 搜索结果（远程搜索） -->
      <div v-if="isNumericSearch && searchQuery.trim()" class="bg-white dark:bg-slate-900 mb-2">
        <div v-if="isSearching" class="p-4 text-center">
          <span class="text-slate-500 dark:text-slate-400 text-sm">搜索中...</span>
        </div>
        <div v-else-if="searchResult" class="p-4 border-b border-slate-200 dark:border-slate-800">
          <div class="flex items-center gap-3">
            <!-- 群组头像 -->
            <div
              v-if="searchResult.group.avatar"
              class="size-12 rounded-full bg-cover bg-center border border-slate-200 dark:border-slate-700 shrink-0"
              :style="{ backgroundImage: `url(${searchResult.group.avatar})` }"
            ></div>
            <div
              v-else
              class="size-12 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-sm shrink-0"
            >
              <span class="material-symbols-outlined text-white text-2xl">groups</span>
            </div>

            <!-- 群组信息 -->
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-slate-900 dark:text-slate-100 truncate">
                {{ searchResult.group.name }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                群号: {{ searchResult.group.groupNumber }} · {{ searchResult.group.memberCount }} 人
              </p>
              <p v-if="searchResult.group.description" class="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">
                {{ searchResult.group.description }}
              </p>
            </div>

            <!-- 操作按钮 -->
            <div class="shrink-0">
              <button
                v-if="searchResult.isMember"
                @click="handleGroupClick(searchResult.group.id)"
                class="px-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                进入
              </button>
              <button
                v-else
                @click="handleJoinGroup(searchResult.group)"
                class="px-4 py-1.5 text-sm bg-primary text-white rounded-full hover:bg-primary/90 transition-colors"
              >
                {{ searchResult.group.isPublic ? '加入' : '申请加入' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 我的群组列表 -->
      <div v-if="!isNumericSearch || !searchQuery.trim()" class="bg-white dark:bg-slate-900">
        <!-- 我的申请入口 -->
        <div
          @click="handleMyJoinRequestsClick"
          class="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <div class="size-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-slate-600 dark:text-slate-300 text-2xl">pending_actions</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-slate-900 dark:text-white">我的申请</p>
            <p class="text-xs text-slate-500 dark:text-slate-400">查看我发送的入群申请</p>
          </div>
          <span class="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
        </div>

        <div v-if="filteredGroups.length > 0" class="px-4 py-2">
          <h2 class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            我的群组
          </h2>
        </div>
        <template v-if="filteredGroups.length > 0">
          <ChatListItem
            v-for="group in filteredGroups"
            :key="group.id"
            :avatar="group.avatar || undefined"
            :name="group.name"
            :last-message="getLastMessage(group.id) || undefined"
            :time="formatConversationTime(getLastMessageTime(group.id))"
            :unread-count="getUnreadCount(group.id)"
            :is-group="true"
            @click="handleGroupClick(group.id)"
          />
        </template>
        <p v-else class="text-slate-500 dark:text-slate-400 text-center py-8 text-sm">
          {{ searchQuery ? '未找到匹配的群组' : '暂无群组' }}
        </p>
      </div>
    </div>

    <BottomNav />
  </div>
</template>
