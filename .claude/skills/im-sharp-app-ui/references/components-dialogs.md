# Dialog and Modal Components

## ConfirmationModal.vue - 确认对话框

标准确认对话框,支持自定义标题、消息和按钮文字。

### Props

```typescript
interface Props {
  show: boolean           // 是否显示对话框
  title: string           // 对话框标题
  message: string         // 对话框消息内容
  confirmText?: string    // 确认按钮文字(默认"确认")
  cancelText?: string     // 取消按钮文字(默认"取消")
  danger?: boolean        // 是否为危险操作(红色按钮)
}
```

### Events

- `update:show`: 对话框显示状态变化
- `confirm`: 确认按钮点击
- `cancel`: 取消按钮点击

### 特性

- 背景遮罩和毛玻璃效果
- 进入/退出动画
- 点击遮罩关闭
- ARIA 可访问性支持

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showModal = ref(false)

const handleConfirm = () => {
  console.log('确认操作')
  showModal.value = false
}
</script>

<template>
  <ConfirmationModal
    v-model:show="showModal"
    title="删除确认"
    message="确定要删除这条消息吗？此操作无法撤销。"
    confirm-text="删除"
    danger
    @confirm="handleConfirm"
  />
</template>
```

### 实现要点

- 遮罩层: `fixed inset-0 bg-black/40 z-modal-backdrop backdrop-blur-sm`
- 对话框容器: `fixed inset-0 z-modal flex items-center justify-center p-4`
- 对话框: `bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-sm w-full p-6`
- 标题: `text-lg font-semibold text-gray-900 dark:text-white mb-2`
- 消息: `text-sm text-gray-500 dark:text-gray-400 mb-6`
- 按钮容器: `flex gap-3`
- 取消按钮: `flex-1 py-2 px-4 rounded-lg border border-gray-300`
- 确认按钮(普通): `flex-1 py-2 px-4 rounded-lg bg-primary text-white`
- 确认按钮(危险): `flex-1 py-2 px-4 rounded-lg bg-danger text-white`
- 进入动画: `animate-fade-in` (遮罩) + `animate-zoom-in` (对话框)

---

## SuccessModal.vue - 成功提示对话框

成功操作提示对话框,带成功图标和自动关闭功能。

### Props

```typescript
interface Props {
  show: boolean           // 是否显示对话框
  message: string         // 提示消息
  autoClose?: number      // 自动关闭延迟(毫秒,默认 2000)
}
```

### Events

- `update:show`: 对话框显示状态变化
- `close`: 对话框关闭事件

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showSuccess = ref(false)

const handleSave = async () => {
  // 保存操作
  showSuccess.value = true
}
</script>

<template>
  <SuccessModal
    v-model:show="showSuccess"
    message="保存成功"
    :auto-close="2000"
  />
</template>
```

### 实现要点

- 使用 `setTimeout` 实现自动关闭
- 成功图标: `check_circle` (Material Symbols)
- 图标颜色: `text-green-500`
- 图标大小: `text-5xl` (48px)
- 消息字体: `text-base font-medium text-gray-900 dark:text-white`
- 对话框: `bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center`

---

## DropdownMenu.vue - 下拉菜单

下拉菜单组件,支持图标、文字和点击外部关闭。

### Props

```typescript
interface Props {
  show: boolean                    // 是否显示菜单
  items: MenuItem[]                // 菜单项数组
  position?: MenuPosition          // 菜单位置(默认 'bottom-right')
}

interface MenuItem {
  key: string        // 菜单项唯一标识
  label: string      // 显示文字
  icon?: string      // Material Symbols 图标名称
  danger?: boolean   // 是否为危险操作(红色高亮)
}

type MenuPosition = 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
```

### Events

- `update:show`: 菜单显示状态变化
- `select`: 菜单项选择事件,参数为选中项的 key

### 特性

- 自动定位
- 点击外部关闭
- 进入/退出动画
- 危险操作项红色高亮

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showMenu = ref(false)

const menuItems = [
  { key: 'edit', label: '编辑', icon: 'edit' },
  { key: 'share', label: '分享', icon: 'share' },
  { key: 'delete', label: '删除', icon: 'delete', danger: true }
]

const handleSelect = (key: string) => {
  console.log('选中:', key)
  showMenu.value = false
}
</script>

<template>
  <div class="relative">
    <button @click="showMenu = !showMenu">
      <span class="material-symbols-outlined">more_vert</span>
    </button>
    
    <DropdownMenu
      v-model:show="showMenu"
      :items="menuItems"
      position="bottom-right"
      @select="handleSelect"
    />
  </div>
</template>
```

### 实现要点

- 容器: `absolute z-dropdown`
- 位置类:
  - `bottom-right`: `top-full right-0 mt-2`
  - `bottom-left`: `top-full left-0 mt-2`
  - `top-right`: `bottom-full right-0 mb-2`
  - `top-left`: `bottom-full left-0 mb-2`
- 菜单: `bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 min-w-[160px]`
- 菜单项: `flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-100`
- 危险项: `text-danger hover:bg-red-50`
- 图标大小: `text-xl` (20px)
- 进入动画: `animate-slide-in-from-bottom`
- 使用 `v-click-outside` 指令或 `onClickOutside` 组合式函数

---

## NoticeModal.vue - 公告详情对话框

公告详情展示对话框,支持长内容滚动。

### Props

```typescript
interface Props {
  show: boolean       // 是否显示对话框
  title: string       // 公告标题
  content: string     // 公告内容
  date?: string       // 发布日期(可选)
}
```

### Events

- `update:show`: 对话框显示状态变化

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showNotice = ref(false)
const notice = {
  title: '系统维护通知',
  content: '系统将于今晚 22:00-24:00 进行维护...',
  date: '2024-03-10'
}
</script>

<template>
  <NoticeModal
    v-model:show="showNotice"
    :title="notice.title"
    :content="notice.content"
    :date="notice.date"
  />
</template>
```

### 实现要点

- 对话框: `bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col`
- 头部: `flex items-center justify-between p-6 border-b border-gray-200`
- 标题: `text-lg font-semibold text-gray-900 dark:text-white`
- 日期: `text-sm text-gray-500 dark:text-gray-400`
- 内容区域: `flex-1 overflow-y-auto p-6 hide-scrollbar`
- 内容: `text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap`
- 关闭按钮: `p-2 rounded-lg hover:bg-gray-100`
- 关闭图标: `close`
