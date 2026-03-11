<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores'
import { Input, Button } from '@/components'

const router = useRouter()
const authStore = useAuthStore()

const oAuthToken = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!oAuthToken.value) {
    errorMessage.value = '请输入 OAuth Token'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await authStore.login(oAuthToken.value)
    router.push('/')
  } catch (error: any) {
    errorMessage.value = error.response?.data?.message || '登录失败,请重试'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
    <div class="w-full max-w-md">
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <span class="material-symbols-outlined text-primary text-5xl">chat_bubble</span>
          </div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">IMSharp</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">即时通讯应用</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <Input
            v-model="oAuthToken"
            label="OAuth Token"
            placeholder="请输入 OAuth Token"
            :disabled="isLoading"
            :error="errorMessage"
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            full-width
            :loading="isLoading"
            :disabled="isLoading"
          >
            {{ isLoading ? '登录中...' : '登录' }}
          </Button>
        </form>

        <div class="mt-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>提示: 这是一个演示应用</p>
          <p>请使用有效的 OAuth Token 登录</p>
        </div>
      </div>
    </div>
  </div>
</template>
