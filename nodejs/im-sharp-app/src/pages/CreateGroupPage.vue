<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGroupsStore, useContactsStore, useUiStore } from '@/stores'
import { Input, Button, LoadingSpinner, Header } from '@/components'
import { mediaApi } from '@/services/api'
import type { User } from '@/types'

const router = useRouter()
const groupsStore = useGroupsStore()
const contactsStore = useContactsStore()
const uiStore = useUiStore()

const groupName = ref('')
const groupDescription = ref('')
const isPublic = ref(true)
const selectedMembers = ref<Set<string>>(new Set())
const isCreating = ref(false)
const searchQuery = ref('')
const avatarUrl = ref('')
const avatarFile = ref<File | null>(null)
const avatarPreview = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)

// 过滤好友列表
const filteredFriends = computed(() => {
  if (!searchQuery.value.trim()) {
    return contactsStore.friends
  }
  const query = searchQuery.value.toLowerCase()
  return contactsStore.friends.filter(friend =>
    (friend.displayName || friend.username).toLowerCase().includes(query)
  )
})

// 已选成员列表
const selectedMembersList = computed(() => {
  return contactsStore.friends.filter(friend => selectedMembers.value.has(friend.id))
})

// 切换成员选择
function toggleMember(userId: string) {
  if (selectedMembers.value.has(userId)) {
    selectedMembers.value.delete(userId)
  } else {
    selectedMembers.value.add(userId)
  }
}

// 移除已选成员
function removeMember(userId: string) {
  selectedMembers.value.delete(userId)
}

// 选择头像文件
function handleAvatarClick() {
  fileInputRef.value?.click()
}

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

// 创建群组
async function handleCreateGroup() {
  if (!groupName.value.trim()) {
    uiStore.showToast('请输入群组名称', 'error')
    return
  }

  isCreating.value = true

  try {
    // 如果选了头像，先上传
    if (avatarFile.value) {
      const res = await mediaApi.uploadAvatar(avatarFile.value)
      avatarUrl.value = res.url
    }

    const group = await groupsStore.createGroup(
      groupName.value.trim(),
      Array.from(selectedMembers.value),
      avatarUrl.value || undefined,
      groupDescription.value.trim() || undefined,
      isPublic.value
    )

    uiStore.showToast('群组创建成功', 'success')
    router.push(`/groups/${group.id}/chat`)
  } catch (error) {
    console.error('创建群组失败:', error)
    uiStore.showToast('创建群组失败', 'error')
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <div class="relative flex h-screen flex-col bg-white dark:bg-slate-900 overflow-hidden">
    <Header title="创建群聊" :show-back="true" @back="router.back()">
      <template #right>
        <button
          @click="handleCreateGroup"
          :disabled="isCreating"
          class="size-8 flex items-center justify-center text-primary font-bold text-sm disabled:opacity-50"
        >
          <svg
            v-if="isCreating"
            class="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-else>完成</span>
        </button>
      </template>
    </Header>

    <!-- 内容区 -->
    <div class="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-6 space-y-8">
      <!-- 头像区域 -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative" @click="handleAvatarClick">
          <div class="size-24 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 overflow-hidden group hover:border-primary transition-colors cursor-pointer">
            <img v-if="avatarPreview" :src="avatarPreview" class="size-full object-cover" />
            <span v-else class="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_a_photo</span>
          </div>
          <div class="absolute -bottom-2 -right-2 bg-primary text-white size-8 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-slate-900">
            <span class="material-symbols-outlined text-sm">edit</span>
          </div>
        </div>
        <p class="text-xs text-slate-500 font-medium">点击设置群组头像</p>
        <input ref="fileInputRef" type="file" accept="image/*" class="hidden" @change="handleAvatarChange" />
      </div>

      <!-- 表单区域 -->
      <div class="space-y-6">
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">群组名称</label>
          <input
            v-model="groupName"
            type="text"
            placeholder="输入群名称..."
            class="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-base focus:ring-2 focus:ring-primary/50 shadow-sm transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">群组简介</label>
          <textarea
            v-model="groupDescription"
            rows="3"
            placeholder="介绍一下这个群组吧..."
            class="w-full bg-white dark:bg-slate-800 border-none rounded-xl py-3 px-4 text-base focus:ring-2 focus:ring-primary/50 shadow-sm transition-all resize-none text-slate-900 dark:text-white placeholder:text-slate-400"
          ></textarea>
        </div>

        <div class="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">public</span>
            <div>
              <p class="text-sm font-bold text-slate-900 dark:text-white">是否公开</p>
              <p class="text-[10px] text-slate-500 dark:text-slate-400">公开群聊用户无需许可即可加入</p>
            </div>
          </div>
          <button
            @click="isPublic = !isPublic"
            :class="[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
              isPublic ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            ]"
          >
            <span
              :class="[
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                isPublic ? 'translate-x-6' : 'translate-x-1'
              ]"
            />
          </button>
        </div>

        <!-- 选择成员区域 -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">选择成员</label>

          <!-- 已选成员 -->
          <div v-if="selectedMembersList.length > 0" class="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm">
            <div class="flex flex-wrap gap-2">
              <div
                v-for="member in selectedMembersList"
                :key="member.id"
                class="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full pl-1 pr-3 py-1"
              >
                <div
                  v-if="member.avatar"
                  class="size-6 rounded-full bg-cover bg-center"
                  :style="{ backgroundImage: `url(${member.avatar})` }"
                ></div>
                <div
                  v-else
                  class="size-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center"
                >
                  <span class="material-symbols-outlined text-slate-400 text-sm">person</span>
                </div>
                <span class="text-xs text-slate-900 dark:text-white">
                  {{ member.displayName || member.username }}
                </span>
                <button
                  @click="removeMember(member.id)"
                  class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <span class="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 搜索框 -->
          <div class="flex w-full items-center rounded-xl bg-slate-200/50 dark:bg-slate-800/50 px-4 py-2.5">
            <span class="material-symbols-outlined text-slate-500 dark:text-slate-400 text-xl">search</span>
            <input
              v-model="searchQuery"
              class="flex w-full border-none bg-transparent focus:outline-0 focus:ring-0 text-base placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white"
              placeholder="搜索好友..."
              type="text"
            />
          </div>

          <!-- 好友列表 -->
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm max-h-64 overflow-y-auto">
            <div
              v-for="friend in filteredFriends"
              :key="friend.id"
              @click="toggleMember(friend.id)"
              class="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
            >
              <div
                v-if="friend.avatar"
                class="size-10 rounded-full bg-cover bg-center shrink-0"
                :style="{ backgroundImage: `url(${friend.avatar})` }"
              ></div>
              <div
                v-else
                class="size-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0"
              >
                <span class="material-symbols-outlined text-slate-400 text-xl">person</span>
              </div>

              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {{ friend.displayName || friend.username }}
                </p>
              </div>

              <div
                :class="[
                  'size-5 rounded border-2 flex items-center justify-center shrink-0',
                  selectedMembers.has(friend.id)
                    ? 'bg-primary border-primary'
                    : 'border-slate-300 dark:border-slate-600'
                ]"
              >
                <span
                  v-if="selectedMembers.has(friend.id)"
                  class="material-symbols-outlined text-white text-sm"
                >
                  check
                </span>
              </div>
            </div>

            <p
              v-if="filteredFriends.length === 0"
              class="text-center text-sm text-slate-500 dark:text-slate-400 py-8"
            >
              {{ searchQuery ? '未找到匹配的好友' : '暂无好友' }}
            </p>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="pt-4">
        <button
          @click="handleCreateGroup"
          :disabled="isCreating"
          class="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-80 flex items-center justify-center gap-2"
        >
          <svg
            v-if="isCreating"
            class="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isCreating ? '正在创建...' : '立即创建' }}
        </button>
      </div>
    </div>
  </div>
</template>
