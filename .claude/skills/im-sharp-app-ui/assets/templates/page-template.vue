<script setup lang="ts">
/**
 * Page Name: [PageName]
 * Description: [Brief description of what this page does]
 */

import { ref } from 'vue'
import Header from '@/components/Header.vue'
import BottomNav from '@/components/BottomNav.vue'

// 页面状态
// TODO: 添加页面状态

// 导航项配置
const navItems = [
  { name: 'chats', label: '消息', icon: 'chat', path: '/chats' },
  { name: 'contacts', label: '联系人', icon: 'contacts', path: '/contacts' },
  { name: 'profile', label: '我的', icon: 'person', path: '/profile' }
]

// 页面方法
// TODO: 添加页面方法
</script>

<template>
  <div class="min-h-screen bg-background-light dark:bg-background-dark">
    <!-- 页面头部 -->
    <Header title="页面标题" :show-back="false">
      <template #right>
        <!-- TODO: 添加右侧操作按钮 -->
      </template>
    </Header>
    
    <!-- 页面内容 -->
    <main class="pb-16">
      <div class="p-4">
        <!-- TODO: 添加页面内容 -->
      </div>
    </main>
    
    <!-- 底部导航 -->
    <BottomNav :items="navItems" />
  </div>
</template>

<style scoped>
/* 如果需要自定义样式,在这里添加 */
/* 优先使用 Tailwind CSS 类 */
</style>
