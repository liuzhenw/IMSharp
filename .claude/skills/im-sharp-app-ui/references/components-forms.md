# Form Components

## Button.vue - 按钮组件

多样式按钮组件,支持加载状态、禁用状态和图标。

### Props

```typescript
interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'  // 按钮样式(默认 'primary')
  size?: 'sm' | 'md' | 'lg'                               // 按钮大小(默认 'md')
  loading?: boolean                                        // 是否显示加载状态
  disabled?: boolean                                       // 是否禁用
  icon?: string                                            // 图标名称(可选)
  iconPosition?: 'left' | 'right'                         // 图标位置(默认 'left')
}
```

### Slots

- `default`: 按钮文字内容
- `icon`: 自定义图标

### 使用示例

```vue
<!-- 主按钮 -->
<Button variant="primary" :loading="isLoading">
  保存
</Button>

<!-- 危险按钮 -->
<Button variant="danger" icon="delete">
  删除
</Button>

<!-- 次要按钮 -->
<Button variant="secondary" size="sm">
  取消
</Button>

<!-- 幽灵按钮 -->
<Button variant="ghost" icon="more_vert" />
```

### 实现要点

**基础样式:**
- 所有按钮: `rounded-lg font-medium transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed`

**尺寸:**
- `sm`: `py-1.5 px-3 text-sm`
- `md`: `py-2 px-4 text-base`
- `lg`: `py-3 px-6 text-lg`

**变体样式:**
- `primary`: `bg-primary text-white hover:bg-primary/90 shadow-primary-20 hover:shadow-primary-25`
- `secondary`: `bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700`
- `danger`: `bg-danger text-white hover:bg-danger/90`
- `ghost`: `text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800`

**加载状态:**
- 显示旋转图标: `<span class="material-symbols-outlined animate-spin">progress_activity</span>`
- 禁用按钮点击

---

## Input.vue - 输入框组件

文本输入框组件,支持前缀图标、后缀图标和验证状态。

### Props

```typescript
interface Props {
  modelValue: string                                    // 输入值
  type?: 'text' | 'password' | 'email' | 'number'      // 输入类型(默认 'text')
  placeholder?: string                                  // 占位符文字
  disabled?: boolean                                    // 是否禁用
  error?: string                                        // 错误提示文字
  prefixIcon?: string                                   // 前缀图标
  suffixIcon?: string                                   // 后缀图标
}
```

### Events

- `update:modelValue`: 输入值变化
- `focus`: 获得焦点
- `blur`: 失去焦点

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
</script>

<template>
  <Input
    v-model="email"
    type="email"
    placeholder="请输入邮箱"
    prefix-icon="email"
    :error="emailError"
  />
  
  <Input
    v-model="password"
    type="password"
    placeholder="请输入密码"
    prefix-icon="lock"
  />
</template>
```

### 实现要点

- 容器: `relative`
- 输入框: `w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-150`
- 有前缀图标时: `pl-11`
- 有后缀图标时: `pr-11`
- 错误状态: `border-danger focus:ring-danger`
- 前缀图标: `absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl`
- 后缀图标: `absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl`
- 错误提示: `mt-1 text-sm text-danger`

---

## Textarea.vue - 文本域组件

多行文本输入组件,支持自动高度调整。

### Props

```typescript
interface Props {
  modelValue: string      // 输入值
  placeholder?: string    // 占位符文字
  rows?: number           // 初始行数(默认 3)
  maxRows?: number        // 最大行数(可选)
  disabled?: boolean      // 是否禁用
  error?: string          // 错误提示文字
  autoResize?: boolean    // 是否自动调整高度(默认 true)
}
```

### Events

- `update:modelValue`: 输入值变化

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const message = ref('')
</script>

<template>
  <Textarea
    v-model="message"
    placeholder="请输入消息..."
    :rows="3"
    :max-rows="10"
    auto-resize
  />
</template>
```

### 实现要点

- 文本域: `w-full py-3 px-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-150 resize-none`
- 自动高度调整: 使用 `@input` 事件监听,动态设置 `style.height`
- 计算高度: `Math.min(scrollHeight, maxRows * lineHeight)`

---

## SearchInput.vue - 搜索输入框

搜索输入框组件,带搜索图标和清除按钮,支持防抖搜索。

### Props

```typescript
interface Props {
  modelValue: string      // 搜索值
  placeholder?: string    // 占位符文字(默认"搜索...")
  debounce?: number       // 防抖延迟(毫秒,默认 300)
}
```

### Events

- `update:modelValue`: 搜索值变化
- `search`: 防抖后的搜索事件

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')

const handleSearch = (query: string) => {
  console.log('搜索:', query)
  // 执行搜索逻辑
}
</script>

<template>
  <SearchInput
    v-model="searchQuery"
    placeholder="搜索聊天"
    :debounce="300"
    @search="handleSearch"
  />
</template>
```

### 实现要点

- 容器: `relative`
- 输入框: `w-full py-3 pl-11 pr-11 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-150`
- 搜索图标: `absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl`
- 清除按钮: `absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer`
- 清除图标: `close`
- 防抖实现: 使用 `setTimeout` 和 `clearTimeout`

---

## Toggle.vue - 开关组件

开关切换组件,带平滑动画和自定义颜色。

### Props

```typescript
interface Props {
  modelValue: boolean                 // 开关状态
  disabled?: boolean                  // 是否禁用
  size?: 'sm' | 'md' | 'lg'          // 开关大小(默认 'md')
  color?: string                      // 开启时的颜色(默认使用主色调)
}
```

### Events

- `update:modelValue`: 开关状态变化

### 特性

- 平滑过渡动画
- 触摸友好
- 键盘可访问(Space/Enter 切换)

### 使用示例

```vue
<script setup lang="ts">
import { ref } from 'vue'

const darkMode = ref(false)
const notifications = ref(true)
</script>

<template>
  <div class="flex items-center justify-between">
    <span>暗色模式</span>
    <Toggle v-model="darkMode" />
  </div>
  
  <div class="flex items-center justify-between">
    <span>消息通知</span>
    <Toggle v-model="notifications" color="#10b981" />
  </div>
</template>
```

### 实现要点

**尺寸:**
- `sm`: 轨道 `w-9 h-5`, 圆点 `w-4 h-4`
- `md`: 轨道 `w-11 h-6`, 圆点 `w-5 h-5`
- `lg`: 轨道 `w-14 h-7`, 圆点 `w-6 h-6`

**样式:**
- 轨道(关闭): `bg-gray-300 dark:bg-gray-700`
- 轨道(开启): `bg-primary` (或自定义颜色)
- 轨道: `relative inline-flex items-center rounded-full cursor-pointer transition-colors duration-200`
- 圆点: `absolute left-0.5 bg-white rounded-full shadow-md transform transition-transform duration-200`
- 圆点(开启): `translate-x-[calc(100%-0.25rem)]` (根据尺寸调整)
- 禁用状态: `opacity-60 cursor-not-allowed`

**可访问性:**
- 使用 `role="switch"`
- 使用 `aria-checked` 属性
- 支持键盘操作: `@keydown.space.prevent` 和 `@keydown.enter.prevent`
