<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { Avatar, Input, Textarea, Button } from '@/components'

const router = useRouter()
const authStore = useAuthStore()

const displayName = ref(authStore.user?.displayName || '')
const bio = ref('')
const isLoading = ref(false)

async function handleSave() {
  isLoading.value = true
  try {
    await authStore.updateProfile(displayName.value)
    router.back()
  } catch (error) {
    console.error('Update profile failed:', error)
  } finally {
    isLoading.value = false
  }
}

function handleAvatarUpload() {
  // TODO: 实现头像上传
  console.log('上传头像')
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
    <header class="flex items-center justify-between px-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
      <Button
        variant="ghost"
        size="sm"
        :disabled="isLoading"
        @click="router.back()"
      >
        取消
      </Button>
      <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">编辑资料</h1>
      <Button
        variant="ghost"
        size="sm"
        :disabled="isLoading"
        :loading="isLoading"
        @click="handleSave"
      >
        {{ isLoading ? '保存中' : '保存' }}
      </Button>
    </header>

    <div class="p-6 space-y-8 bg-slate-50 dark:bg-slate-900/50 min-h-screen">
      <!-- Avatar Section -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative cursor-pointer" @click="handleAvatarUpload">
          <Avatar :src="authStore.user?.avatar || undefined" size="xl" />
          <div class="absolute -bottom-2 -right-2 bg-primary text-white size-8 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 shadow-md">
            <span class="material-symbols-outlined text-sm">edit</span>
          </div>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">点击更换头像</p>
      </div>

      <!-- Form Section -->
      <div class="space-y-6">
        <Input
          v-model="displayName"
          label="显示名称"
          placeholder="输入显示名称..."
        />

        <Textarea
          v-model="bio"
          label="个性签名"
          placeholder="介绍一下自己吧..."
          :rows="3"
        />
      </div>

      <div class="pt-4">
        <Button
          variant="primary"
          size="lg"
          full-width
          :loading="isLoading"
          :disabled="isLoading"
          @click="handleSave"
        >
          {{ isLoading ? '保存中...' : '保存修改' }}
        </Button>
      </div>
    </div>
  </div>
</template>
