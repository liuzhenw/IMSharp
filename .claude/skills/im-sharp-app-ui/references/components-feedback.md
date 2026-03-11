# Feedback Components

## LoadingSpinner.vue - 加载动画

加载动画组件,支持自定义大小和颜色。

### Props

```typescript
interface Props {
  size?: 'sm' | 'md' | 'lg' | number    // 加载动画大小(默认 'md')
  color?: string                         // 加载动画颜色(默认主色调)
  fullscreen?: boolean                   // 是否全屏显示
  text?: string                          // 加载提示文字(可选)
}
```

### 尺寸规范

- `sm`: 16px (`w-4 h-4`)
- `md`: 24px (`w-6 h-6`)
- `lg`: 32px (`w-8 h-8`)
- 自定义: 传入数字(px)

### 使用示例

```vue
<!-- 行内加载 -->
<LoadingSpinner size="sm" />

<!-- 全屏加载 -->
<LoadingSpinner fullscreen text="加载中..." />

<!-- 自定义颜色和大小 -->
<LoadingSpinner :size="40" color="#10b981" />
```

### 实现要点

**行内模式:**
- 容器: `inline-flex items-center justify-center`
- SVG 旋转动画: `animate-spin`

**全屏模式:**
- 遮罩层: `fixed inset-0 bg-black/40 z-modal backdrop-blur-sm flex items-center justify-center`
- 内容容器: `flex flex-col items-center gap-3`
- 加载文字: `text-white text-sm font-medium`

**SVG 实现:**
```vue
<svg
  class="animate-spin"
  :width="size"
  :height="size"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <circle
    class="opacity-25"
    cx="12"
    cy="12"
    r="10"
    :stroke="color"
    stroke-width="4"
  />
  <path
    class="opacity-75"
    :fill="color"
    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
  />
</svg>
```

---

## EmojiPicker.vue - 表情选择器

表情选择器组件,网格布局,支持点击选择和动画展开/收起。

### Props

```typescript
interface Props {
  show: boolean                // 是否显示选择器
  emojis?: string[]            // 表情数组(默认使用常用表情)
  columns?: number             // 列数(默认 8)
  maxHeight?: number           // 最大高度(默认 300px)
}
```

### Events

- `update:show`: 显示状态变化
- `select`: 表情选择事件,参数为选中的表情

### 默认表情列表

```typescript
const defaultEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
  '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
  '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨',
  '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕',
  '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '😵', '🤯',
  '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁',
  '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
  '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠',
  '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹',
  '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹',
  '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚',
  '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
  '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌'
]
```

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const showEmojiPicker = ref(false)
const message = ref('')

const handleEmojiSelect = (emoji: string) => {
  message.value += emoji
  showEmojiPicker.value = false
}
</script>

<template>
  <div class="relative">
    <button @click="showEmojiPicker = !showEmojiPicker">
      <span class="material-symbols-outlined">sentiment_satisfied</span>
    </button>
    
    <EmojiPicker
      v-model:show="showEmojiPicker"
      @select="handleEmojiSelect"
    />
  </div>
</template>
```

### 实现要点

- 容器: `absolute bottom-full left-0 mb-2 z-dropdown`
- 选择器: `bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2`
- 网格布局: `grid gap-1` + 动态列数 `grid-cols-${columns}`
- 表情按钮: `w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer transition-colors`
- 滚动容器: `overflow-y-auto hide-scrollbar` + 最大高度
- 进入动画: `animate-slide-in-from-bottom`
- 点击外部关闭: 使用 `v-click-outside` 指令或 `onClickOutside` 组合式函数
