<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Avatar, Button, ConfirmationModal } from '@/components'

const route = useRoute()
const router = useRouter()
const groupId = route.params.id as string
const isConfirmOpen = ref(false)

function handleInviteMember() {
  // TODO: 跳转到邀请成员页面
  console.log('邀请成员')
}

function handleViewAllMembers() {
  // TODO: 跳转到群成员列表页面
  console.log('查看全部群成员')
}

function handleDeleteAndExit() {
  // TODO: 调用退出群组 API
  console.log('删除并退出群组:', groupId)
  isConfirmOpen.value = false
  router.push('/groups')
}
</script>

<template>
  <div class="min-h-screen w-full bg-slate-50 dark:bg-slate-900 pb-10">
    <header class="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-800 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-800">
      <button
        @click="router.back()"
        class="size-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 class="text-lg font-bold flex-1 text-center pr-10 text-slate-900 dark:text-white">聊天信息</h1>
    </header>

    <div class="bg-white dark:bg-slate-800 p-4">
      <div class="grid grid-cols-5 gap-4">
        <!-- 示例成员头像 -->
        <!-- <div v-for="member in members" :key="member.id" class="flex flex-col items-center gap-2">
          <Avatar :src="member.avatar" size="md" :online="member.online" />
          <p class="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full text-center">{{ member.name }}</p>
        </div> -->

        <div class="flex flex-col items-center gap-2">
          <button
            @click="handleInviteMember"
            class="w-full aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            <span class="material-symbols-outlined">add</span>
          </button>
          <p class="text-[10px] text-slate-500 dark:text-slate-400">邀请</p>
        </div>
      </div>
      <button
        @click="handleViewAllMembers"
        class="w-full mt-4 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-1 text-slate-400 hover:text-primary transition-colors py-2"
      >
        <span class="text-sm font-medium">查看全部群成员</span>
        <span class="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>

    <div class="mt-4 bg-white dark:bg-slate-800">
      <div class="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
        <span class="text-slate-900 dark:text-white">群聊名称</span>
        <span class="text-slate-500 dark:text-slate-400">群组 {{ groupId }}</span>
      </div>
      <div class="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
        <span class="text-slate-900 dark:text-white">群公告</span>
        <div class="flex items-center gap-1 min-w-0 flex-1 justify-end ml-4">
          <span class="text-slate-500 dark:text-slate-400 truncate text-sm">未设置</span>
          <span class="material-symbols-outlined text-slate-400 text-sm shrink-0">chevron_right</span>
        </div>
      </div>
    </div>

    <div class="mt-8 px-4">
      <Button variant="danger" full-width @click="isConfirmOpen = true">
        删除并退出
      </Button>
    </div>

    <ConfirmationModal
      :is-open="isConfirmOpen"
      title="确认退出"
      message="确定要退出该群组吗?"
      variant="danger"
      @confirm="handleDeleteAndExit"
      @cancel="isConfirmOpen = false"
    />
  </div>
</template>
