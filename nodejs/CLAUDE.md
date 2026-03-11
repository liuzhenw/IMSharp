# IMSharp 前端项目开发指南

## 项目概述

这是 IMSharp 即时通讯系统的前端项目，使用 Vue 3 + TypeScript 构建的单页应用。

**关键特点**:
- 完全自定义 UI 组件库（无第三方 UI 框架）
- SignalR 实时通讯
- IndexedDB 本地消息缓存
- JWT 自动刷新机制

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 (Composition API) | 3.5.29 |
| 语言 | TypeScript | 5.9.3 |
| 构建工具 | Vite | 7.3.1 |
| 样式 | Tailwind CSS | 3.4.19 |
| 状态管理 | Pinia | 3.0.4 |
| 路由 | Vue Router | 5.0.3 |
| HTTP 客户端 | Axios | 1.13.6 |
| 实时通讯 | @microsoft/signalr | 10.0.0 |
| 本地存储 | Dexie (IndexedDB) | 4.3.0 |
| 包管理器 | **pnpm** | - |

**重要**: 必须使用 `pnpm`，不要使用 `npm` 或 `yarn`。

## 项目结构

```
im-sharp-app/
├── src/
│   ├── components/     # 自定义 UI 组件（22个）
│   ├── pages/          # 页面组件（13个，路由懒加载）
│   ├── stores/         # Pinia stores（5个）
│   │   ├── auth.ts     # 认证状态
│   │   ├── chat.ts     # 聊天消息
│   │   ├── contacts.ts # 联系人
│   │   ├── groups.ts   # 群组
│   │   └── ui.ts       # UI 状态
│   ├── services/       # API 服务层和 SignalR 配置
│   │   ├── http.ts     # Axios 实例和拦截器
│   │   ├── signalr.ts  # SignalR 连接管理
│   │   └── *.service.ts # 各模块 API 服务
│   ├── router/         # 路由配置
│   ├── types/          # TypeScript 类型定义
│   ├── App.vue
│   ├── main.ts
│   └── style.css
├── public/
├── vite.config.ts      # Vite 配置（包含代理）
├── tailwind.config.js
└── package.json
```

## 常用命令

```bash
# 开发
pnpm run dev              # 启动开发服务器（支持局域网访问）

# 构建
pnpm run build            # 构建生产版本
pnpm run preview          # 预览生产构建

# 代码质量
pnpm run type-check       # TypeScript 类型检查
pnpm run lint             # 代码检查（oxlint + eslint）
pnpm run format           # 代码格式化（Prettier）

# 测试
pnpm run test:unit        # 运行单元测试（Vitest）
```

## 架构设计

### 1. 状态管理（Pinia）

5 个独立的 store 管理不同领域：

- **auth.ts**: 用户认证、token 管理、自动刷新
- **chat.ts**: 聊天消息、会话列表、消息发送
- **contacts.ts**: 好友列表、好友请求
- **groups.ts**: 群组列表、群组成员
- **ui.ts**: 全局 UI 状态（侧边栏、模态框等）

**约定**:
- 使用 Composition API 风格定义 store
- 异步操作放在 actions 中
- 复杂计算使用 computed

### 2. 服务层（services/）

**http.ts** - Axios 配置:
- 基础 URL: `http://localhost:5185`
- 请求拦截器: 自动添加 JWT token
- 响应拦截器: 处理 401 错误，自动刷新 token

**signalr.ts** - SignalR 配置:
- Hub URL: `http://localhost:5185/hubs/chat`
- 自动重连机制
- 事件监听器注册

**约定**:
- 每个模块一个 service 文件（如 `auth.service.ts`）
- Service 只负责 API 调用，不包含业务逻辑
- 返回类型化的 Promise

### 3. 本地存储（IndexedDB）

使用 Dexie 实现消息缓存：

- **目的**: 离线查看历史消息
- **存储内容**: 私聊消息、群聊消息
- **同步策略**: SignalR 接收消息时自动存储

**关键文件**: `src/services/db.ts`

### 4. 路由配置

- 所有页面组件使用懒加载（`() => import()`）
- 路由守卫检查认证状态
- 未登录用户重定向到登录页

## 与后端集成

### API 调用

**Vite 代理配置** (`vite.config.ts`):
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:5185',
    changeOrigin: true
  },
  '/hubs': {
    target: 'http://localhost:5185',
    changeOrigin: true,
    ws: true
  }
}
```

**认证流程**:
1. 登录成功后获取 `accessToken` 和 `refreshToken`
2. `accessToken` 存储在 Pinia store（内存）
3. `refreshToken` 存储在 localStorage
4. Axios 拦截器自动添加 `Authorization: Bearer {token}`
5. Token 过期时自动调用刷新接口

### SignalR 实时通讯

**连接管理**:
- 登录后自动建立连接
- 连接断开时自动重连
- 登出时手动断开连接

**事件监听**:
- `ReceivePrivateMessage`: 接收私聊消息
- `ReceiveGroupMessage`: 接收群聊消息
- `UserStatusChanged`: 用户在线状态变化
- `FriendRequestReceived`: 收到好友请求

**约定**:
- 在 `signalr.ts` 中注册全局事件监听器
- 事件处理逻辑调用对应的 store actions
- 接收到消息后同步到 IndexedDB

## 关键约定

### 代码风格

- **组件**: 使用 `<script setup>` 语法
- **类型**: 优先使用 `interface` 而非 `type`
- **命名**: 组件文件使用 PascalCase，其他文件使用 kebab-case
- **导入**: 使用 `@/` 别名引用 `src/` 目录

### UI 组件开发

**重要**: 项目不使用任何第三方 UI 库（如 Element Plus、Ant Design）。

所有 UI 组件都是自定义的，基于 Tailwind CSS：

- **按钮**: `components/Button.vue`
- **输入框**: `components/Input.vue`
- **模态框**: `components/Modal.vue`
- **下拉菜单**: `components/Dropdown.vue`
- 等等...

**开发新组件时**:
1. 参考现有组件的设计风格
2. 使用 Tailwind 工具类
3. 支持必要的 props 和 emits
4. 添加 TypeScript 类型定义

### 错误处理

- API 错误在 Axios 拦截器中统一处理
- 显示用户友好的错误提示（使用 toast 组件）
- 关键操作添加 try-catch
- 不要静默吞掉错误

### 性能优化

- 路由懒加载已配置
- 大列表使用虚拟滚动（如需要）
- 图片使用懒加载
- 避免不必要的响应式数据

## 开发环境要求

- **Node.js**: >= 18.x
- **pnpm**: 最新版本
- **后端服务**: 确保后端 API 在 `http://localhost:5185` 运行

## 调试技巧

### Vue DevTools

安装 Vue DevTools 浏览器扩展，可以：
- 查看组件树和 props
- 检查 Pinia store 状态
- 追踪路由变化

### SignalR 调试

在浏览器控制台查看 SignalR 日志：
```typescript
// 在 signalr.ts 中设置日志级别
.configureLogging(LogLevel.Debug)
```

### IndexedDB 调试

使用浏览器开发者工具的 Application/Storage 面板查看 IndexedDB 数据。

## 常见问题

### Token 过期处理

如果遇到频繁 401 错误：
1. 检查 `http.ts` 中的 token 刷新逻辑
2. 确认 `refreshToken` 在 localStorage 中存在
3. 检查后端刷新接口是否正常

### SignalR 连接失败

如果 SignalR 无法连接：
1. 确认后端 SignalR Hub 正在运行
2. 检查 Vite 代理配置中的 `/hubs` 路径
3. 查看浏览器控制台的 WebSocket 错误

### 样式不生效

如果 Tailwind 样式不生效：
1. 确认 `tailwind.config.js` 中的 `content` 配置正确
2. 检查是否需要重启开发服务器
3. 清除浏览器缓存

## 参考资料

- **API 文档**: `/docs/API_DOCUMENTATION.md`
- **设计原型**: `/prototype-design/index.html`
- **后端项目**: `/dotnet/` 目录
- **Vue 3 文档**: https://vuejs.org/
- **Pinia 文档**: https://pinia.vuejs.org/
- **SignalR 文档**: https://learn.microsoft.com/aspnet/core/signalr/


## 重要说明
页面样式必须严格遵循原型设计