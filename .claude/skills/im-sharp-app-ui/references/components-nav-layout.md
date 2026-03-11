# Navigation and Layout Components

## BottomNav.vue - 底部导航栏

固定在底部的导航栏,支持多个标签页切换,集成 Vue Router。

### Props

```typescript
interface Props {
  items: NavItem[]
}

interface NavItem {
  name: string    // 导航项唯一标识
  label: string   // 显示文字
  icon: string    // Material Symbols 图标名称
  path: string    // 路由路径
}
```

### 特性

- 自动高亮当前路由
- 图标 + 文字标签
- 响应式设计
- 暗色模式支持
- 固定在底部 (`fixed bottom-0`)
- 使用 `z-sticky` 层级

### 使用示例

```vue
<script setup lang="ts">
const navItems = [
  { name: 'chats', label: '消息', icon: 'chat', path: '/chats' },
  { name: 'contacts', label: '联系人', icon: 'contacts', path: '/contacts' },
  { name: 'profile', label: '我的', icon: 'person', path: '/profile' }
]
</script>

<template>
  <BottomNav :items="navItems" />
</template>
```

### 实现要点

- 使用 `router-link` 实现导航
- 使用 `router.currentRoute` 判断当前路由
- 活动状态使用主色调 (`text-primary`)
- 非活动状态使用次要文字颜色 (`text-gray-500`)
- 图标大小: 24px
- 文字大小: `text-xs`
- 内边距: `py-2 px-4`
- 背景: `bg-white dark:bg-gray-800`
- 边框: `border-t border-gray-200 dark:border-gray-700`

---

## Header.vue - 页面头部组件

灵活的页面头部组件,支持返回按钮、标题、副标题和自定义操作按钮。

### Props

```typescript
interface Props {
  title: string           // 标题文字
  subtitle?: string       // 副标题文字(可选)
  showBack?: boolean      // 是否显示返回按钮(默认 true)
  centerTitle?: boolean   // 标题是否居中(默认 true)
}
```

### Slots

- `left`: 左侧自定义内容(替代返回按钮)
- `right`: 右侧自定义内容(操作按钮)

### Events

- `back`: 返回按钮点击事件
- `action`: 操作按钮点击事件

### 使用示例

```vue
<!-- 基础用法 -->
<Header title="消息" :show-back="false" />

<!-- 带副标题 -->
<Header title="张三" subtitle="在线" />

<!-- 自定义右侧按钮 -->
<Header title="聊天">
  <template #right>
    <button class="p-2 rounded-lg hover:bg-gray-100">
      <span class="material-symbols-outlined">more_vert</span>
    </button>
  </template>
</Header>
```

### 实现要点

- 固定在顶部 (`sticky top-0`)
- 使用 `z-sticky` 层级
- 高度: `h-14` (56px)
- 内边距: `px-4`
- 背景: `bg-white dark:bg-gray-800`
- 边框: `border-b border-gray-200 dark:border-gray-700`
- 标题字体: `text-lg font-semibold`
- 副标题字体: `text-sm text-gray-500`
- 返回按钮图标: `arrow_back`
- 按钮悬停效果: `hover:bg-gray-100 dark:hover:bg-gray-700`

---

## TabBar.vue - 标签栏切换

水平标签切换组件,带活动状态下划线和平滑过渡动画。

### Props

```typescript
interface Props {
  tabs: Tab[]           // 标签数组
  modelValue: string    // 当前活动标签的 key
}

interface Tab {
  key: string      // 标签唯一标识
  label: string    // 显示文字
  count?: number   // 可选的数字徽章
}
```

### Events

- `update:modelValue`: 标签切换事件

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('all')

const tabs = [
  { key: 'all', label: '全部', count: 10 },
  { key: 'unread', label: '未读', count: 3 }
]
</script>

<template>
  <TabBar v-model="activeTab" :tabs="tabs" />
</template>
```

### 实现要点

- 水平滚动容器: `flex overflow-x-auto hide-scrollbar`
- 标签按钮: `px-4 py-3 text-sm font-medium`
- 活动状态: `text-primary border-b-2 border-primary`
- 非活动状态: `text-gray-500 border-b-2 border-transparent`
- 过渡效果: `transition-colors duration-150`
- 数字徽章: `ml-1 px-1.5 py-0.5 text-xs rounded-full bg-gray-100`
- 背景: `bg-white dark:bg-gray-800`
- 边框: `border-b border-gray-200 dark:border-gray-700`
- 下划线动画: 使用 `transform` 和 `transition-transform`
