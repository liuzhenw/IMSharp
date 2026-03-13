<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useUiStore } from '@/stores'
import { mediaApi } from '@/services'
import { Avatar, Input, Textarea, Button, Header } from '@/components'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUiStore()

const displayName = ref(authStore.user?.displayName || '')
const bio = ref('')
const avatarUrl = ref(authStore.user?.avatar || '')
const isLoading = ref(false)
const isUploadingAvatar = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

async function handleSave() {
  isLoading.value = true
  try {
    await authStore.updateProfile(displayName.value, avatarUrl.value || undefined)
    uiStore.showToast('保存成功', 'success')
    router.back()
  } catch (error) {
    console.error('Update profile failed:', error)
    uiStore.showToast('保存失败', 'error')
  } finally {
    isLoading.value = false
  }
}

function handleAvatarUpload() {
  fileInputRef.value?.click()
}

async function handleFileSelect(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    uiStore.showToast('只支持 JPG、PNG、GIF、WebP 格式的图片', 'error')
    return
  }

  // 验证文件大小（10MB）
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    uiStore.showToast('图片大小不能超过 10MB', 'error')
    return
  }

  isUploadingAvatar.value = true
  try {
    const result = await mediaApi.uploadAvatar(file)
    avatarUrl.value = result.url
    uiStore.showToast('头像上传成功', 'success')
  } catch (error) {
    console.error('Upload avatar failed:', error)
    uiStore.showToast('头像上传失败', 'error')
  } finally {
    isUploadingAvatar.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900">
    <Header title="编辑资料">
      <template #left>
        <Button
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          @click="router.back()"
        >
          取消
        </Button>
      </template>
      <template #right>
        <Button
          variant="ghost"
          size="sm"
          :disabled="isLoading"
          :loading="isLoading"
          @click="handleSave"
        >
          {{ isLoading ? '保存中' : '保存' }}
        </Button>
      </template>
    </Header>

    <div class="p-6 space-y-8 bg-slate-50 dark:bg-slate-900/50 min-h-screen">
      <!-- Avatar Section -->
      <div class="flex flex-col items-center gap-4">
        <div class="relative cursor-pointer" @click="handleAvatarUpload">
          <Avatar :src="avatarUrl || undefined" size="xl" />
          <div class="absolute -bottom-2 -right-2 bg-primary text-white size-8 rounded-full flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 shadow-md">
            <span v-if="!isUploadingAvatar" class="material-symbols-outlined text-sm">edit</span>
            <span v-else class="material-symbols-outlined text-sm animate-spin">progress_activity</span>
          </div>
        </div>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {{ isUploadingAvatar ? '上传中...' : '点击更换头像' }}
        </p>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          class="hidden"
          @change="handleFileSelect"
        />
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
