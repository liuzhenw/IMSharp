# Usage Guide

## 安装和配置

### 1. 安装依赖

```bash
# 安装 Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 安装 Vue Router(如果使用导航组件)
npm install vue-router@4
```

### 2. 配置 Tailwind CSS

参考 `assets/tailwind.config.js` 文件,或使用以下简化配置:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#ec5b13',
        'background-light': '#f5f7f8',
        'background-dark': '#0f1923',
        danger: '#ef4444',
        online: '#10b981',
        offline: '#6b7280',
      },
      fontFamily: {
        display: ['Public Sans', 'Noto Sans SC', 'sans-serif']
      },
      fontSize: {
        'badge': '10px',
      },
      zIndex: {
        'dropdown': '10',
        'sticky': '20',
        'modal-backdrop': '40',
        'modal': '50',
        'toast': '60',
      },
    },
  },
  plugins: [],
}
```

### 3. 引入 Material Symbols 图标

在 `index.html` 中添加:

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">
```

### 4. 全局样式

在 `src/style.css` 中添加:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Public Sans', 'Noto Sans SC', sans-serif;
    min-height: 100dvh;
  }
}

@layer utilities {
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## 最佳实践

### 1. 暗色模式

使用 `dark:` 前缀为所有组件添加暗色模式样式:

```vue
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  <!-- 内容 -->
</div>
```

在根组件中切换暗色模式:

```typescript
// 切换暗色模式
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark')
}

// 初始化暗色模式(根据系统偏好或本地存储)
const initDarkMode = () => {
  const isDark = localStorage.getItem('darkMode') === 'true' ||
    (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  if (isDark) {
    document.documentElement.classList.add('dark')
  }
}
```

### 2. 响应式设计

使用 Tailwind 的响应式前缀:

```vue
<div class="p-4 md:p-6 lg:p-8">
  <!-- 不同屏幕尺寸不同内边距 -->
</div>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <!-- 响应式网格布局 -->
</div>
```

### 3. 组件组合

优先使用组件组合而不是创建新组件:

```vue
<template>
  <Header title="聊天">
    <template #right>
      <Button variant="ghost" icon="more_vert" @click="showMenu = true" />
    </template>
  </Header>
  
  <DropdownMenu v-model:show="showMenu" :items="menuItems" />
</template>
```

### 4. 类型安全

为所有组件定义完整的 TypeScript 类型:

```typescript
interface Props {
  title: string
  subtitle?: string
  showBack?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showBack: true
})

interface Emits {
  (e: 'back'): void
  (e: 'action', id: string): void
}

const emit = defineEmits<Emits>()
```

### 5. 可访问性

确保所有交互元素都有适当的 ARIA 属性:

```vue
<button
  aria-label="关闭对话框"
  @click="close"
>
  <span class="material-symbols-outlined">close</span>
</button>

<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="dialog-title"
>
  <h2 id="dialog-title">{{ title }}</h2>
  <!-- 对话框内容 -->
</div>
```

### 6. 性能优化

- 使用 `v-show` 而不是 `v-if` 来切换频繁显示/隐藏的元素
- 使用 `v-once` 渲染静态内容
- 使用 `v-memo` 缓存复杂列表项

```vue
<ChatListItem
  v-for="chat in chats"
  :key="chat.id"
  v-memo="[chat.lastMessage, chat.unreadCount]"
  :chat="chat"
/>
```

---

## 常见使用场景

### 场景 1: 聊天列表页面

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import SearchInput from '@/components/SearchInput.vue'
import TabBar from '@/components/TabBar.vue'
import ChatListItem from '@/components/ChatListItem.vue'
import BottomNav from '@/components/BottomNav.vue'

const searchQuery = ref('')
const activeTab = ref('all')

const tabs = [
  { key: 'all', label: '全部', count: 10 },
  { key: 'unread', label: '未读', count: 3 }
]

const chats = ref([
  {
    id: 1,
    avatar: '/avatar1.jpg',
    name: '张三',
    lastMessage: '你好',
    timestamp: '10:30',
    unreadCount: 2,
    online: true
  }
])
</script>

<template>
  <div class="min-h-screen bg-background-light dark:bg-background-dark">
    <Header title="消息" :show-back="false">
      <template #right>
        <button class="p-2 rounded-lg hover:bg-gray-100">
          <span class="material-symbols-outlined">add</span>
        </button>
      </template>
    </Header>
    
    <div class="p-4">
      <SearchInput v-model="searchQuery" placeholder="搜索聊天" />
    </div>
    
    <TabBar v-model="activeTab" :tabs="tabs" />
    
    <div class="pb-16">
      <ChatListItem
        v-for="chat in chats"
        :key="chat.id"
        v-bind="chat"
        @click="navigateToChat(chat.id)"
      />
    </div>
    
    <BottomNav :items="navItems" />
  </div>
</template>
```

### 场景 2: 聊天详情页面

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import Input from '@/components/Input.vue'
import Button from '@/components/Button.vue'

const message = ref('')

const messages = ref([
  {
    id: 1,
    type: 'received',
    content: '你好',
    timestamp: '10:30',
    avatar: '/avatar.jpg'
  },
  {
    id: 2,
    type: 'sent',
    content: '你好，有什么可以帮你的吗？',
    timestamp: '10:31',
    read: true
  }
])

const sendMessage = () => {
  if (!message.value.trim()) return
  
  messages.value.push({
    id: Date.now(),
    type: 'sent',
    content: message.value,
    timestamp: new Date().toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    read: false
  })
  
  message.value = ''
}
</script>

<template>
  <div class="flex flex-col h-screen bg-background-light dark:bg-background-dark">
    <Header title="张三" subtitle="在线" />
    
    <div class="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        v-bind="msg"
      />
    </div>
    
    <div class="border-t border-gray-200 dark:border-gray-800 p-4">
      <div class="flex items-end gap-2">
        <Input
          v-model="message"
          placeholder="输入消息..."
          @keyup.enter="sendMessage"
          class="flex-1"
        />
        
        <Button
          variant="primary"
          icon="send"
          @click="sendMessage"
          :disabled="!message.trim()"
        />
      </div>
    </div>
  </div>
</template>
```

### 场景 3: 用户设置页面

```vue
<script setup lang="ts">
import { ref } from 'vue'
import Header from '@/components/Header.vue'
import Avatar from '@/components/Avatar.vue'
import Toggle from '@/components/Toggle.vue'
import Button from '@/components/Button.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'

const darkMode = ref(false)
const notifications = ref(true)
const showLogoutModal = ref(false)

const handleLogout = () => {
  console.log('退出登录')
}
</script>

<template>
  <div class="min-h-screen bg-background-light dark:bg-background-dark">
    <Header title="设置" />
    
    <div class="p-4 space-y-6">
      <!-- 用户信息 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl p-6">
        <div class="flex items-center gap-4">
          <Avatar
            src="/avatar.jpg"
            size="xl"
            editable
            @edit="editAvatar"
          />
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              张三
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              ID: 123456
            </p>
          </div>
        </div>
      </div>
      
      <!-- 设置项 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
        <div class="flex items-center justify-between p-4">
          <span class="text-gray-900 dark:text-white">暗色模式</span>
          <Toggle v-model="darkMode" />
        </div>
        
        <div class="flex items-center justify-between p-4">
          <span class="text-gray-900 dark:text-white">消息通知</span>
          <Toggle v-model="notifications" />
        </div>
      </div>
      
      <!-- 退出登录 -->
      <Button
        variant="danger"
        class="w-full"
        @click="showLogoutModal = true"
      >
        退出登录
      </Button>
    </div>
    
    <ConfirmationModal
      v-model:show="showLogoutModal"
      title="退出登录"
      message="确定要退出登录吗？"
      confirm-text="退出"
      danger
      @confirm="handleLogout"
    />
  </div>
</template>
```

---

## 注意事项

1. **颜色一致性**: 始终使用设计系统中定义的颜色变量,不要硬编码颜色值
2. **间距规范**: 使用 Tailwind 的间距类(`p-4`, `m-2` 等),保持间距一致性
3. **圆角统一**: 按钮和输入框使用 `rounded-lg`(8px),卡片使用 `rounded-xl`(12px)
4. **暗色模式**: 所有组件都应支持暗色模式,使用 `dark:` 前缀
5. **响应式**: 确保组件在不同屏幕尺寸下都能正常显示
6. **可访问性**: 添加适当的 ARIA 属性,支持键盘导航
7. **性能**: 避免不必要的重渲染,使用 `v-memo` 优化列表性能
8. **类型安全**: 为所有 props 和 events 定义 TypeScript 类型
