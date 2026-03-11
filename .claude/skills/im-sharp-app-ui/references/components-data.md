# Data Display Components

## Avatar.vue - 头像组件

头像组件,支持圆形/方形、在线状态指示器、群组头像和编辑按钮。

### Props

```typescript
interface Props {
  src: string                                    // 头像图片 URL
  alt?: string                                   // 图片替代文字
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'       // 头像大小(默认 'md')
  shape?: 'circle' | 'square'                    // 头像形状(默认 'circle')
  online?: boolean                               // 是否显示在线状态
  editable?: boolean                             // 是否显示编辑按钮
  badge?: number                                 // 徽章数字(可选)
}
```

### Events

- `click`: 头像点击事件
- `edit`: 编辑按钮点击事件

### 尺寸规范

- `xs`: 24px (`w-6 h-6`)
- `sm`: 32px (`w-8 h-8`)
- `md`: 40px (`w-10 h-10`)
- `lg`: 48px (`w-12 h-12`)
- `xl`: 64px (`w-16 h-16`)

### 使用示例

```vue
<Avatar
  src="/avatar.jpg"
  alt="用户头像"
  size="lg"
  online
  editable
  @edit="handleEditAvatar"
/>
```

### 实现要点

- 容器: `relative inline-block`
- 头像: `object-cover` + 尺寸类
- 圆形: `rounded-full`
- 方形: `rounded-lg`
- 在线状态指示器: `absolute bottom-0 right-0 w-3 h-3 bg-online border-2 border-white rounded-full`
- 编辑按钮: `absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity`
- 徽章: 使用 Badge 组件包裹

---

## Badge.vue - 徽章组件

徽章组件,用于显示未读消息数或状态点。

### Props

```typescript
interface Props {
  count?: number                                                    // 徽章数字
  max?: number                                                      // 最大显示数字(默认 99)
  dot?: boolean                                                     // 是否显示为圆点
  color?: string                                                    // 徽章颜色(默认主色调)
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'  // 徽章位置
}
```

### Slots

- `default`: 徽章附着的元素

### 使用示例

```vue
<Badge :count="5">
  <button>消息</button>
</Badge>

<Badge dot>
  <Avatar src="/avatar.jpg" />
</Badge>
```

### 实现要点

- 容器: `relative inline-block`
- 徽章: `absolute z-10 flex items-center justify-center`
- 位置类:
  - `top-right`: `-top-1 -right-1`
  - `top-left`: `-top-1 -left-1`
  - `bottom-right`: `-bottom-1 -right-1`
  - `bottom-left`: `-bottom-1 -left-1`
- 数字徽章: `min-w-[20px] h-5 px-1.5 text-badge font-medium text-white bg-primary rounded-full`
- 圆点徽章: `w-2 h-2 bg-primary rounded-full`
- 超过最大值显示: `${max}+`

---

## ChatListItem.vue - 聊天列表项

聊天列表项组件,显示头像、用户名/群名、最后消息、时间戳和未读徽章。

### Props

```typescript
interface Props {
  avatar: string          // 头像 URL
  name: string            // 用户名或群名
  lastMessage: string     // 最后一条消息内容
  timestamp: string       // 时间戳
  unreadCount?: number    // 未读消息数
  online?: boolean        // 是否在线
  pinned?: boolean        // 是否置顶
  muted?: boolean         // 是否静音
}
```

### Events

- `click`: 列表项点击事件

### 使用示例

```vue
<ChatListItem
  avatar="/avatar.jpg"
  name="张三"
  last-message="你好"
  timestamp="10:30"
  :unread-count="2"
  online
  @click="navigateToChat"
/>
```

### 实现要点

- 容器: `flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors`
- 置顶背景: `bg-gray-50 dark:bg-gray-800`
- 头像: `Avatar` 组件,size="md"
- 内容区域: `flex-1 min-w-0`
- 顶部行: `flex items-center justify-between mb-1`
- 用户名: `text-base font-medium text-gray-900 dark:text-white truncate`
- 时间戳: `text-xs text-gray-500 dark:text-gray-400 flex-shrink-0`
- 底部行: `flex items-center justify-between`
- 最后消息: `text-sm text-gray-500 dark:text-gray-400 truncate`
- 静音图标: `text-gray-400 text-sm`
- 未读徽章: `Badge` 组件

---

## ContactListItem.vue - 联系人列表项

联系人列表项组件,显示头像、用户名和在线状态。

### Props

```typescript
interface Props {
  avatar: string       // 头像 URL
  name: string         // 用户名
  online?: boolean     // 是否在线
  subtitle?: string    // 副标题(可选,如签名)
}
```

### Events

- `click`: 列表项点击事件

### 实现要点

- 容器: `flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors`
- 头像: `Avatar` 组件,size="md",显示在线状态
- 用户名: `text-base font-medium text-gray-900 dark:text-white`
- 副标题: `text-sm text-gray-500 dark:text-gray-400 truncate`

---

## MessageBubble.vue - 消息气泡

消息气泡组件,支持发送/接收消息、文字/图片消息、时间戳和已读状态。

### Props

```typescript
interface Props {
  type: 'sent' | 'received'                      // 消息类型
  content: string                                 // 消息内容
  messageType?: 'text' | 'image' | 'file'        // 内容类型(默认 'text')
  timestamp?: string                              // 时间戳
  read?: boolean                                  // 是否已读(仅发送消息)
  avatar?: string                                 // 发送者头像(仅接收消息)
  senderName?: string                             // 发送者名称(仅群聊接收消息)
}
```

### 样式规范

```css
/* 发送消息 */
background: var(--color-primary);
color: white;
border-radius: 12px 12px 4px 12px;

/* 接收消息 */
background: white;
color: var(--color-text-primary);
border-radius: 12px 12px 12px 4px;
```

### 实现要点

**发送消息:**
- 容器: `flex justify-end`
- 气泡: `max-w-[70%] bg-primary text-white rounded-xl rounded-br-sm p-3`
- 已读状态: `text-xs text-white/80 mt-1 flex items-center gap-1`
- 已读图标: `done_all` (双勾)

**接收消息:**
- 容器: `flex justify-start gap-2`
- 头像: `Avatar` 组件,size="sm"
- 气泡: `max-w-[70%] bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl rounded-bl-sm p-3 shadow-sm`
- 发送者名称: `text-xs text-gray-500 mb-1` (仅群聊)

**图片消息:**
- 图片: `rounded-lg max-w-full cursor-pointer`
- 点击预览: 触发图片预览事件

---

## NoticeBar.vue - 通知栏

通知栏组件,显示公告信息,支持点击查看详情和关闭。

### Props

```typescript
interface Props {
  title: string           // 公告标题
  content: string         // 公告内容(简短)
  closable?: boolean      // 是否可关闭(默认 true)
  icon?: string           // 图标名称(默认 'campaign')
}
```

### Events

- `click`: 通知栏点击事件
- `close`: 关闭按钮点击事件

### 实现要点

- 容器: `flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 cursor-pointer`
- 图标: `text-yellow-600 dark:text-yellow-500 text-xl flex-shrink-0`
- 内容区域: `flex-1 min-w-0`
- 标题: `text-sm font-medium text-gray-900 dark:text-white`
- 内容: `text-xs text-gray-600 dark:text-gray-400 truncate`
- 关闭按钮: `text-gray-400 hover:text-gray-600 flex-shrink-0`
