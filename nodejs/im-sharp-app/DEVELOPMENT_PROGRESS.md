# IMSharpApp 开发进度文档

> 最后更新: 2026-03-10

## 项目概述

IMSharpApp 是一个基于 Vue 3 + TypeScript 的现代化即时通讯应用前端,与 .NET 10 后端 (IMSharp) 配合使用。

**技术栈**:
- Vue 3.5.29 + Composition API
- TypeScript 5.9.3
- Tailwind CSS 3.4.19
- Pinia 3.0.4 (状态管理)
- Vue Router 5.0.3
- Axios 1.13.6 (HTTP 客户端)
- SignalR 10.0.0 (实时通讯)
- Material Symbols 图标

**后端 API**:
- 基础 URL: `http://localhost:5185`
- 认证: JWT + OAuth 2.0
- 实时通讯: SignalR Hub (`/hubs/chat`)

---

## 开发进度总览

| 阶段 | 状态 | 完成度 | 备注 |
|------|------|--------|------|
| Phase 1: 项目配置和基础设施 | ✅ 完成 | 100% | 2026-03-10 |
| Phase 2: UI 组件库 (20 个) | ✅ 完成 | 100% | 2026-03-10 |
| Phase 3: TypeScript 类型定义 | ✅ 完成 | 100% | 2026-03-10 |
| Phase 4: API 服务层 | ✅ 完成 | 100% | 2026-03-10 |
| Phase 5: 状态管理 (Pinia) | ✅ 完成 | 100% | 2026-03-10 |
| Phase 6: 路由配置 | ✅ 完成 | 100% | 2026-03-10 |
| Phase 7: 页面组件实现 | ✅ 完成 | 100% | 2026-03-10 |
| Phase 8: 集成和测试 | ⏳ 待开发 | 0% | - |

**总体进度**: 约 87.5% (Phase 1-7 完成,Phase 8 待开发)

---

## Phase 1: 项目配置和基础设施 ✅

**状态**: 完成
**完成时间**: 2026-03-10

### 已完成任务

- [x] 安装 Tailwind CSS 本地依赖
  - `tailwindcss 3.4.19`
  - `postcss 8.5.8`
  - `autoprefixer 10.4.27`
- [x] 配置 Tailwind CSS (`tailwind.config.js`)
  - 使用 UI 规范中的设计系统颜色
  - 配置自定义字体、间距、阴影
  - 启用暗色模式 (`darkMode: 'class'`)
- [x] 更新全局样式 (`src/style.css`)
  - 引入 Tailwind 指令
  - 添加自定义工具类 (hide-scrollbar 等)
- [x] 配置环境变量
  - `.env`
  - `.env.development`
- [x] 配置 Vite 代理 (`vite.config.ts`)
  - API 代理到 `http://localhost:5185`
  - SignalR WebSocket 代理
- [x] 引入 Material Symbols 图标
  - 在 `index.html` 中添加 CDN 链接
- [x] 引入字体
  - Public Sans
  - Noto Sans SC

### 关键文件

```
nodejs/im-sharp-app/
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
├── .env
├── .env.development
├── index.html
└── src/
    ├── style.css
    └── main.ts
```

---

## Phase 2: UI 组件库 (20 个) ✅

**状态**: 完成
**完成时间**: 2026-03-10

### 已完成组件列表

#### 2.1 导航和布局组件 (3 个)
- [x] `src/components/BottomNav.vue` - 底部导航栏
- [x] `src/components/Header.vue` - 页面头部
- [x] `src/components/TabBar.vue` - 标签栏切换

#### 2.2 对话框和弹窗组件 (4 个)
- [x] `src/components/ConfirmationModal.vue` - 确认对话框
- [x] `src/components/SuccessModal.vue` - 成功提示
- [x] `src/components/DropdownMenu.vue` - 下拉菜单
- [x] `src/components/NoticeModal.vue` - 公告详情

#### 2.3 表单组件 (5 个)
- [x] `src/components/Button.vue` - 按钮
- [x] `src/components/Input.vue` - 输入框
- [x] `src/components/Textarea.vue` - 文本域
- [x] `src/components/SearchInput.vue` - 搜索框
- [x] `src/components/Toggle.vue` - 开关

#### 2.4 数据展示组件 (6 个)
- [x] `src/components/Avatar.vue` - 头像
- [x] `src/components/Badge.vue` - 徽章
- [x] `src/components/ChatListItem.vue` - 聊天列表项
- [x] `src/components/ContactListItem.vue` - 联系人列表项
- [x] `src/components/MessageBubble.vue` - 消息气泡
- [x] `src/components/NoticeBar.vue` - 通知栏

#### 2.5 反馈组件 (2 个)
- [x] `src/components/LoadingSpinner.vue` - 加载动画
- [x] `src/components/EmojiPicker.vue` - 表情选择器

### 实现特性

- ✅ 使用 Vue 3 Composition API + TypeScript
- ✅ 完整的 Props 和 Events 类型定义
- ✅ 支持暗色模式
- ✅ 遵循 UI 规范的样式和交互
- ✅ 统一导出 (`src/components/index.ts`)

### 关键文件

```
src/components/
├── BottomNav.vue
├── Header.vue
├── TabBar.vue
├── ConfirmationModal.vue
├── SuccessModal.vue
├── DropdownMenu.vue
├── NoticeModal.vue
├── Button.vue
├── Input.vue
├── Textarea.vue
├── SearchInput.vue
├── Toggle.vue
├── Avatar.vue
├── Badge.vue
├── ChatListItem.vue
├── ContactListItem.vue
├── MessageBubble.vue
├── NoticeBar.vue
├── LoadingSpinner.vue
├── EmojiPicker.vue
└── index.ts
```

---

## Phase 3: TypeScript 类型定义 ✅

**状态**: 完成
**完成时间**: 2026-03-10

### 已完成任务

- [x] 创建实体模型类型 (`src/types/models.ts`)
  - User, PrivateMessage, GroupMessage
  - Group, GroupMember, FriendRequest
  - Notification
  - 枚举: MessageType, MessageStatus, GroupRole, FriendRequestStatus, NotificationType
- [x] 创建 API 类型 (`src/types/api.ts`)
  - 请求/响应类型
  - 分页响应类型
  - 错误响应类型
- [x] 创建 SignalR 类型 (`src/types/signalr.ts`)
  - SignalREvents 接口
  - SignalRMethods 接口
  - SignalRConnectionState 枚举
- [x] 导出所有类型 (`src/types/index.ts`)

### 关键文件

```
src/types/
├── models.ts       # 实体模型
├── api.ts          # API 类型
├── signalr.ts      # SignalR 类型
└── index.ts        # 导出
```

---

## Phase 4: API 服务层 ✅

**状态**: 完成
**完成时间**: 2026-03-10

### 已完成任务

- [x] HTTP 客户端配置 (`src/services/http.ts`)
  - Axios 实例配置
  - 请求拦截器 (添加 JWT token)
  - 响应拦截器 (处理 401 错误,自动刷新 token)
- [x] 认证 API (`src/services/api/auth.ts`)
  - login, refresh, revoke, me
- [x] 用户 API (`src/services/api/users.ts`)
  - search, getById, updateProfile
- [x] 好友 API (`src/services/api/friends.ts`)
  - getFriends, sendRequest, getReceivedRequests, getSentRequests
  - processRequest, deleteFriend
- [x] 消息 API (`src/services/api/messages.ts`)
  - getConversation, getUnread, markAsRead, markAllAsRead, send
- [x] 群组 API (`src/services/api/groups.ts`)
  - create, getMyGroups, getById, getMembers, getMessages
  - sendMessage, inviteMembers, removeMember, leave, update, delete
- [x] 文件上传 API (`src/services/api/media.ts`)
  - upload, uploadAvatar (支持上传进度)
- [x] SignalR 服务 (`src/services/signalr.ts`)
  - 连接管理 (connect, disconnect)
  - 自动重连机制
  - 事件监听和触发
  - 方法调用 (sendMessage, sendGroupMessage, markMessageAsRead 等)

### 关键文件

```
src/services/
├── http.ts             # Axios 配置
├── signalr.ts          # SignalR 管理
├── index.ts            # 导出
└── api/
    ├── auth.ts         # 认证 API
    ├── users.ts        # 用户 API
    ├── friends.ts      # 好友 API
    ├── messages.ts     # 消息 API
    ├── groups.ts       # 群组 API
    ├── media.ts        # 文件上传 API
    └── index.ts        # 导出
```

### 关键功能

- JWT token 自动管理和刷新
- SignalR 自动重连 (指数退避策略)
- 文件上传进度跟踪
- 统一的错误处理

---

## Phase 5: 状态管理 (Pinia) ✅

**状态**: 完成
**完成时间**: 2026-03-10

### 已完成任务

- [x] 认证 Store (`src/stores/auth.ts`)
  - 状态: token, refreshToken, user, isLoading
  - 方法: login, refreshAccessToken, fetchCurrentUser, logout, updateProfile, initialize
  - 自动初始化 (如果有 token,自动登录并连接 SignalR)
- [x] 聊天 Store (`src/stores/chat.ts`)
  - 状态: conversations, privateMessages, groupMessages, unreadCounts, typingUsers
  - 方法: loadConversations, loadPrivateMessages, loadGroupMessages
  - 方法: sendPrivateMessage, sendGroupMessage, markAsRead, markAllAsRead
  - SignalR 事件监听: ReceiveMessage, ReceiveGroupMessage, UserTyping, MessageRead
- [x] 联系人 Store (`src/stores/contacts.ts`)
  - 状态: friends, receivedRequests, sentRequests, onlineUsers
  - 方法: loadFriends, loadReceivedRequests, loadSentRequests
  - 方法: sendFriendRequest, processFriendRequest, deleteFriend, searchUsers
  - SignalR 事件监听: UserOnline, UserOffline, FriendRequestReceived, FriendRequestAccepted
- [x] 群组 Store (`src/stores/groups.ts`)
  - 状态: groups, groupMembers
  - 方法: loadGroups, loadGroupMembers, createGroup, updateGroup
  - 方法: inviteMembers, removeMember, leaveGroup, deleteGroup
  - SignalR 事件监听: GroupInvitationReceived, MemberJoinedGroup, MemberLeftGroup, GroupUpdated
- [x] UI Store (`src/stores/ui.ts`)
  - 状态: isDark, isLoading, loadingMessage
  - 方法: toggleDarkMode, setDarkMode, showLoading, hideLoading, initialize
  - 持久化暗色模式设置到 localStorage

### 关键文件

```
src/stores/
├── auth.ts         # 认证状态
├── chat.ts         # 聊天状态
├── contacts.ts     # 联系人状态
├── groups.ts       # 群组状态
├── ui.ts           # UI 状态
└── index.ts        # 导出
```

### 关键功能

- 与 SignalR 事件集成 (实时更新状态)
- 持久化关键状态 (localStorage)
- 自动初始化和清理

---

## Phase 6: 路由配置 ✅

**状态**: 完成
**完成时间**: 2026-03-10

### 已完成任务

- [x] 定义路由结构 (`src/router/index.ts`)
  - 9 个路由 (登录页 + 8 个主要页面)
  - 懒加载页面组件
- [x] 实现认证守卫
  - 未登录访问需要认证的页面 → 重定向到登录页
  - 已登录访问登录页 → 重定向到首页

### 路由列表

| 路径 | 名称 | 组件 | 需要认证 |
|------|------|------|----------|
| `/login` | login | LoginPage | ❌ |
| `/` | - | 重定向到 `/chats` | - |
| `/chats` | chats | ChatsPage | ✅ |
| `/chats/:id` | chat-detail | ChatDetailPage | ✅ |
| `/contacts` | contacts | ContactsPage | ✅ |
| `/contacts/:id` | contact-detail | ContactDetailPage | ✅ |
| `/groups` | groups | GroupsPage | ✅ |
| `/groups/:id` | group-detail | GroupDetailPage | ✅ |
| `/profile` | profile | ProfilePage | ✅ |
| `/profile/edit` | profile-edit | ProfileEditPage | ✅ |

### 关键文件

```
src/router/
└── index.ts        # 路由配置
```

---

## Phase 7: 页面组件实现 ✅

**状态**: 完成
**完成时间**: 2026-03-10
**完成度**: 100%

### 已完成任务

- [x] 创建并完善所有页面 (9 个页面)
- [x] 所有页面使用统一的 UI 组件
- [x] 集成 Pinia stores
- [x] 集成路由导航
- [x] 支持暗色模式

#### 7.1 登录页 (LoginPage.vue) ✅
- [x] OAuth 登录表单 (使用 Input, Button 组件)
- [x] 错误提示
- [x] 加载状态

#### 7.2 聊天列表页 (ChatsPage.vue) ✅
- [x] 搜索框 (使用 SearchInput 组件)
- [x] 标签栏 (全部/未读) (使用 TabBar 组件)
- [x] 聊天列表项 (使用 ChatListItem 组件)
- [x] 下拉菜单 (使用 DropdownMenu 组件)
- [x] 底部导航 (使用 BottomNav 组件)
- [x] 空状态提示

#### 7.3 聊天详情页 (ChatDetailPage.vue) ✅
- [x] 消息列表 (使用 MessageBubble 组件)
- [x] 消息输入框
- [x] 表情选择器 (使用 EmojiPicker 组件)
- [x] 文件上传按钮
- [x] 发送按钮 (输入时显示)

#### 7.4 联系人列表页 (ContactsPage.vue) ✅
- [x] 搜索框 (使用 SearchInput 组件)
- [x] 标签栏 (好友/群组) (使用 TabBar 组件)
- [x] 联系人列表 (使用 ContactListItem 组件)
- [x] 添加好友按钮
- [x] 底部导航 (使用 BottomNav 组件)

#### 7.5 联系人详情页 (ContactDetailPage.vue) ✅
- [x] 用户信息展示 (使用 Avatar 组件)
- [x] 操作按钮 (发消息、删除好友) (使用 Button 组件)
- [x] 删除确认对话框 (使用 ConfirmationModal 组件)

#### 7.6 群组列表页 (GroupsPage.vue) ✅
- [x] 群组列表 (使用 ChatListItem 组件)
- [x] 创建群组按钮 (使用 Header 组件)
- [x] 群组搜索 (使用 SearchInput 组件)
- [x] 底部导航 (使用 BottomNav 组件)

#### 7.7 群组详情页 (GroupDetailPage.vue) ✅
- [x] 群组信息展示
- [x] 成员列表 (使用 Avatar 组件)
- [x] 邀请成员按钮
- [x] 查看全部成员按钮
- [x] 退出群组按钮 (使用 Button 组件)
- [x] 退出确认对话框 (使用 ConfirmationModal 组件)

#### 7.8 个人设置页 (ProfilePage.vue) ✅
- [x] 用户信息展示 (使用 Avatar 组件)
- [x] 暗色模式切换 (使用 Toggle 组件)
- [x] 编辑资料入口
- [x] 退出登录 (使用 Button 组件)
- [x] 底部导航 (使用 BottomNav 组件)

#### 7.9 编辑资料页 (ProfileEditPage.vue) ✅
- [x] 头像展示和上传入口 (使用 Avatar 组件)
- [x] 显示名称编辑 (使用 Input 组件)
- [x] 个性签名编辑 (使用 Textarea 组件)
- [x] 保存按钮 (使用 Button 组件)
- [x] 加载状态

### 关键文件

```
src/pages/
├── LoginPage.vue
├── ChatsPage.vue
├── ChatDetailPage.vue
├── ContactsPage.vue
├── ContactDetailPage.vue
├── GroupsPage.vue
├── GroupDetailPage.vue
├── ProfilePage.vue
└── ProfileEditPage.vue
```

---

## Phase 8: 集成和测试 ⏳

**状态**: 待开发

### 待完成任务

#### 8.1 更新 App.vue
- [x] 添加路由视图
- [x] 添加全局加载状态
- [x] 初始化 SignalR 连接
- [ ] 添加全局错误处理
- [ ] 添加全局 Toast 提示

#### 8.2 实现认证流程
- [x] OAuth 登录
- [x] JWT token 管理
- [x] 自动刷新 token
- [x] 退出登录
- [ ] Token 过期处理优化
- [ ] 登录状态持久化优化

#### 8.3 实现实时通讯
- [x] SignalR 连接管理
- [x] 消息接收和发送
- [x] 在线状态同步
- [x] 正在输入提示
- [ ] 消息送达和已读回执
- [ ] 离线消息处理
- [ ] 重连后消息同步

#### 8.4 测试
- [ ] 单元测试 (组件、stores、services)
- [ ] 集成测试 (页面流程)
- [ ] E2E 测试 (关键用户流程)
- [ ] 跨浏览器测试
- [ ] 移动端适配测试

#### 8.5 优化
- [ ] 代码分割和懒加载
- [ ] 性能优化 (虚拟滚动、图片懒加载)
- [ ] 错误边界处理
- [ ] SEO 优化
- [ ] PWA 支持

---

## 验证结果

### ✅ 已验证

- [x] TypeScript 类型检查通过
- [x] 开发服务器成功启动 (http://localhost:5176/)
- [x] 页面可以正常访问
- [x] 路由导航正常工作
- [x] 暗色模式切换正常
- [x] 所有 UI 组件正常渲染
- [x] 所有页面使用统一组件

### ⏳ 待验证

- [ ] 完整的登录流程
- [ ] SignalR 实时消息收发
- [ ] 文件上传功能
- [ ] 所有 API 调用
- [ ] 移动端响应式布局
- [ ] 性能指标 (首屏加载、交互响应)

---

## 如何运行项目

### 开发环境

```bash
cd nodejs/im-sharp-app

# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 访问 http://localhost:5173
```

### 类型检查

```bash
pnpm run type-check
```

### 代码格式化

```bash
pnpm run format
```

### 代码检查

```bash
pnpm run lint
```

### 构建生产版本

```bash
pnpm run build
pnpm run preview
```

---

## 下一步计划

### 优先级 1 (高)
1. **实现真实数据加载** (Phase 8)
   - 连接后端 API
   - 实现真实的消息收发
   - 实现 SignalR 实时通讯

2. **完善用户体验** (Phase 8)
   - 添加加载状态
   - 添加错误处理
   - 添加 Toast 提示

### 优先级 2 (中)
3. **实现文件上传** (Phase 8)
   - 图片上传
   - 文件上传
   - 头像上传

4. **完善消息功能** (Phase 8)
   - 消息送达和已读回执
   - 离线消息处理
   - 消息历史加载

### 优先级 3 (低)
5. **集成测试** (Phase 8.4)
   - 单元测试
   - E2E 测试

6. **性能优化** (Phase 8.5)
   - 代码分割
   - 虚拟滚动
   - 图片懒加载

---

## 已知问题

### 待解决
- [ ] 会话列表加载逻辑未实现 (需要从好友列表和群组列表构建)
- [ ] 消息列表虚拟滚动未实现 (大量消息时性能问题)
- [ ] 文件上传进度显示未实现
- [ ] 离线消息处理未实现
- [ ] 消息送达和已读回执未完全实现

### 技术债务
- [ ] 错误处理需要统一和优化
- [ ] 加载状态需要统一管理
- [ ] Toast 提示组件需要实现
- [ ] 部分类型定义需要优化 (减少 any 使用)

---

## 参考文档

- **UI 设计规范**: `.claude/skills/im-sharp-app-ui/references/design-system.md`
- **组件规范**: `.claude/skills/im-sharp-app-ui/references/components-*.md`
- **后端 API 文档**: `nodejs/docs/API_DOCUMENTATION.md`
- **实施计划**: `dotnet/IMPLEMENTATION_PLAN.md`

---

## 更新日志

### 2026-03-10
- ✅ 完成 Phase 1: 项目配置和基础设施
  - 安装 Tailwind CSS 3.4.19
  - 配置暗色模式
  - 配置环境变量和 Vite 代理
- ✅ 完成 Phase 2: UI 组件库 (20 个组件)
  - 导航和布局组件 (3 个)
  - 对话框和弹窗组件 (4 个)
  - 表单组件 (5 个)
  - 数据展示组件 (6 个)
  - 反馈组件 (2 个)
- ✅ 完成 Phase 3: TypeScript 类型定义
- ✅ 完成 Phase 4: API 服务层
- ✅ 完成 Phase 5: 状态管理 (Pinia)
- ✅ 完成 Phase 6: 路由配置
- ✅ 完成 Phase 7: 页面组件实现 (9 个页面)
  - 所有页面使用统一的 UI 组件
  - 支持暗色模式
  - 完整的 TypeScript 类型支持
- ✅ 新增: 添加好友页面 (AddFriendPage.vue)
  - 严格遵循原型设计实现
  - 用户搜索功能
  - 搜索结果展示
  - 点击用户跳转到用户详情
  - 点击添加按钮跳转到发送好友请求页面
  - 状态管理 (已添加/已发送/添加)
- ✅ 新增: 发送好友请求页面 (SendFriendRequestPage.vue)
  - 严格遵循原型设计实现
  - 显示目标用户信息
  - 验证消息输入
  - 发送好友请求功能 (包含验证消息)
  - 加载状态和错误处理
- ✅ 新增: 好友请求列表页面 (FriendRequestsPage.vue)
  - 显示待处理的好友请求列表
  - 显示发送者信息和验证消息
  - 接受/拒绝好友请求功能
  - 加载状态和空状态处理
- ✅ 完善: ContactsPage 添加好友请求入口
  - 显示待处理请求数量徽章
  - 点击跳转到好友请求列表页面
  - 自动加载好友请求数据
- ✅ 新增: 全局错误拦截和Toast提示
  - 创建 Toast 组件用于显示全局提示
  - UI Store 添加 toast 状态管理
  - HTTP 拦截器自动捕获并显示错误
  - 支持 success/error/warning/info 四种类型
  - 自动隐藏和手动关闭功能
  - 优先显示服务器返回的错误消息 (error 字段)
  - 友好的默认错误消息提示 (400/403/404/500/网络错误等)
- ✅ 完善: Avatar 组件默认头像
  - 用户头像为空时显示默认头像图标
  - AddFriendPage 和 SendFriendRequestPage 使用 Avatar 组件
  - 统一头像显示逻辑
- ✅ 完善: 用户登录状态持久化
  - localStorage 持久化 token、refreshToken 和用户信息
  - 应用启动时自动恢复登录状态
  - 自动连接 SignalR
  - 失败时自动清除状态
- ✅ 验证: TypeScript 类型检查通过
- ✅ 验证: 开发服务器成功启动 (http://localhost:5176/)
- ✅ 验证: 暗色模式切换正常

### 2026-03-11
- ✅ 完善: ContactsPage 好友列表功能
  - 显示好友列表 (头像、昵称、备注、在线状态)
  - 搜索过滤功能 (按昵称或用户名)
  - 点击好友跳转到好友详情页
  - 空状态和搜索无结果提示
- ✅ 完善: ContactDetailPage 好友详情功能
  - 加载并显示好友信息 (头像、昵称、用户名、在线状态)
  - 发消息按钮 (跳转到聊天页面)
  - 删除好友功能 (带确认对话框)
  - 加载状态和错误处理
  - 未找到好友的空状态提示
- ✅ 实现: 会话列表加载逻辑 (chat store)
  - 从好友列表构建私聊会话
  - 从群组列表构建群聊会话
  - 自动加载好友和群组数据
  - 会话包含最后消息、时间、未读数、在线状态
- ✅ 完善: ChatsPage 会话列表功能
  - 显示会话列表 (头像、名称、最后消息、时间、未读数)
  - 全部/未读标签切换
  - 搜索过滤功能
  - 时间格式化 (今天/昨天/N天前)
  - 点击会话跳转到聊天详情页
  - 空状态提示 (无聊天/无未读/搜索无结果)
- ✅ 实现: ChatDetailPage 完整聊天功能
  - 加载消息历史记录
  - 显示聊天对象信息 (昵称、在线状态)
  - 消息列表展示 (自己/对方消息气泡)
  - 消息时间分组显示 (超过5分钟显示时间)
  - 发送文本消息功能
  - 表情选择器集成
  - 正在输入状态显示
  - 自动滚动到底部
  - 自动标记消息为已读
  - 发送状态显示 (发送中/已发送/已送达/已读)
  - 加载状态和空状态处理
- ✅ 完善: chat store 逻辑优化
  - 添加 currentUserId 状态 (避免循环依赖)
  - 修复 addPrivateMessage 会话 ID 计算逻辑
  - 修复 updateConversation 动态导入问题
  - 正确处理未读数 (只有接收消息才增加)
  - 使用 async/await 替代 require
- ✅ 完善: App.vue 初始化逻辑
  - 登录后设置当前用户 ID 到 chat store
  - 确保 SignalR 事件监听正确初始化
- ✅ 修复: SignalR 消息发送接口
  - 修复 sendMessage 方法,使用对象参数 (target: 'Private', content, type, receiverId)
  - 修复 sendGroupMessage 方法,使用对象参数 (target: 'Group', content, type, groupId)
  - 修复 markMessageAsRead 方法名为 MarkAsRead
  - 添加 markAllAsRead 方法 (调用 MarkAllAsRead)
  - 修复 sendTypingStatus 方法名为 Typing,移除 isTyping 参数
  - 严格遵循 API 文档 4.2.1 节的接口定义
- ✅ 完善: BottomNav 底部导航栏
  - 在"消息"菜单上显示未读消息总数徽章
  - 集成 chatStore.totalUnreadCount
  - 实时同步未读消息数
  - 使用 Badge 组件显示未读数
- ✅ 修复: 发送消息后本地消息显示
  - 添加 MessageSent 事件监听 (SignalR 服务)
  - 监听 MessageSent 事件并添加到本地消息列表 (chat store)
  - 添加 MessageSent 事件类型定义
  - 发送消息后自己的聊天框会立即显示发送的消息
- ✅ 修复: ChatDetailPage 消息排序问题
  - 修复刷新页面后消息顺序显示反了的问题
  - 在 messages computed 中添加按 createdAt 升序排序
  - 确保最旧的消息在上,最新的消息在下
- ✅ 优化: ChatsPage UI 简化
  - 去掉"全部"和"未读"Tab 切换
  - 所有会话统一在一个列表中显示
  - 移除 TabBar 组件和相关逻辑
  - 简化空状态提示文本
- ✅ 修复: 聊天详情页未读消息数问题
  - 修复在聊天详情页收到消息后,退回消息页未读数仍然增加的问题
  - 添加 currentChatId 状态跟踪当前正在查看的聊天
  - 在 addPrivateMessage 中判断,如果是当前聊天则不增加未读数
  - 在 ChatDetailPage 的 onMounted 设置 currentChatId,onUnmounted 清除
  - 确保用户在聊天页面收到消息时不会错误增加未读数
- ✅ 修复: 会话列表未读数显示问题
  - 修复底部菜单栏显示未读数,但消息列表项不显示未读数的问题
  - 在 sortedConversations computed 中动态获取最新的未读数
  - 使用 map 将 unreadCounts Map 中的最新值同步到会话对象
  - 确保 unreadCounts 更新时会话列表自动响应式更新
- ✅ 修复: 聊天详情页滚动位置问题
  - 修复进入聊天详情页面时滚动条不在最底部的问题
  - 将滚动到底部的逻辑移到 finally 块中,确保在加载状态结束后执行
  - 添加 100ms 延迟确保 DOM 完全渲染后再滚动
  - 确保用户进入聊天页面时看到最新消息
- ✅ 更新: API 端点迁移到 v1.1.0
  - 更新 messagesApi 以匹配新的 API 端点结构
  - 私聊消息端点: `/api/messages/conversation/{friendId}` → `/api/messages/private/conversations/{friendId}`
  - 未读消息端点: `/api/messages/unread` → `/api/messages/private/unread`
  - 标记已读端点: `/api/messages/{id}/read` → `/api/messages/private/{messageId}/read`
  - 标记全部已读: `/api/messages/read-all/{friendId}` → `/api/messages/private/conversations/{friendId}/read-all`
  - 发送消息端点: `/api/messages` → `/api/messages/private/send`
  - 新增 getAllUnread() 方法获取统一未读数 (私聊 + 群聊)
  - 更新 groupsApi 群聊消息端点
  - 获取群聊消息: `/api/groups/{id}/messages` → `/api/messages/group/{groupId}`
  - 发送群聊消息: `/api/groups/messages` → `/api/messages/group/{groupId}/send`
  - 所有端点已更新并通过类型检查
- ✅ 验证: TypeScript 类型检查通过
- ✅ 验证: 好友列表、聊天列表、聊天功能完整可用
- ✅ 验证: SignalR 消息发送接口符合后端 API 规范
- ✅ 验证: 未读消息数在底部导航栏正确显示
- ✅ 验证: 未读消息数在会话列表项正确显示
- ✅ 验证: 发送消息后本地消息列表正确更新
- ✅ 验证: 消息按时间正确排序显示
- ✅ 验证: 聊天详情页收到消息不会增加未读数
- ✅ 验证: 进入聊天详情页时滚动条在最底部
- ✅ 验证: API 端点已更新到 v1.1.0
