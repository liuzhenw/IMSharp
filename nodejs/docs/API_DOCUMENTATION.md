# IMSharp API 对接文档

## 1. 概述

### 1.1 项目简介

IMSharp 是一个基于 .NET 10 的现代化即时通讯系统,支持一对一私聊和群组聊天功能。

### 1.2 技术栈

- **后端框架**: ASP.NET Core Web API (.NET 10)
- **实时通讯**: SignalR
- **数据库**: PostgreSQL + Entity Framework Core
- **认证**: JWT + OAuth 2.0
- **文件存储**: 本地文件系统

### 1.3 基础配置

- **API 基础 URL**: `http://localhost:5185`
- **Swagger 文档**: `http://localhost:5185/swagger`
- **SignalR Hub 路径**: `/hubs/chat`

---

## 2. 认证机制

### 2.1 认证流程

IMSharp 使用 JWT (JSON Web Token) 进行身份认证,支持 OAuth 2.0 授权。

#### 认证流程图

```
1. 客户端通过 OAuth 获取 access_token
2. 使用 OAuth access_token 调用 /api/auth/login 获取 JWT token
3. 后续请求在 Header 中携带 JWT token
4. Token 过期后使用 refresh_token 刷新
```

### 2.2 获取 JWT Token

**端点**: `POST /api/auth/login`

**请求体**:
```json
{
  "oAuthAccessToken": "oauth_access_token_from_provider"
}
```

**响应**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh_token_string",
  "user": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "username": "john_doe",
    "displayName": "John Doe",
    "email": "john@example.com",
    "avatar": "avatar_url",
    "isOnline": true,
    "lastOnline": "2026-03-10T10:00:00Z"
  }
}
```

### 2.3 刷新 Token

**端点**: `POST /api/auth/refresh`

**请求体**:
```json
{
  "refreshToken": "refresh_token_string"
}
```

**响应**:
```json
{
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

### 2.4 撤销 Token

**端点**: `POST /api/auth/revoke`
**需要认证**: ✅

**请求体**:
```json
{
  "refreshToken": "refresh_token_string"
}
```

**响应**: `204 No Content`

### 2.5 请求头格式

所有需要认证的 API 请求必须在 HTTP Header 中包含 JWT Token:

```
Authorization: Bearer <your_jwt_token>
```

### 2.6 Token 配置

- **Access Token 有效期**: 1440 分钟 (24 小时)
- **Refresh Token 有效期**: 7 天
- **Token 签发者**: IMSharp
- **Token 受众**: IMSharp.Client

---

## 3. REST API 端点

### 3.1 健康检查

#### 3.1.1 检查服务状态

**端点**: `GET /api/health`
**需要认证**: ❌

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2026-03-10T10:00:00Z"
}
```

**示例**:
```bash
curl http://localhost:5185/api/health
```

```javascript
fetch('http://localhost:5185/api/health')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

### 3.2 认证相关

#### 3.2.1 用户登录

**端点**: `POST /api/auth/login`
**需要认证**: ❌

**请求体**:
```json
{
  "oAuthAccessToken": "string"
}
```

**响应**: 见 2.2 节

**错误码**:
- `400 Bad Request`: OAuth token 无效
- `401 Unauthorized`: 认证失败

**示例**:
```bash
curl -X POST http://localhost:5185/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"oAuthAccessToken":"your_oauth_token"}'
```

```javascript
const response = await fetch('http://localhost:5185/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ oAuthAccessToken: 'your_oauth_token' })
});
const data = await response.json();
```

#### 3.2.2 获取当前用户信息

**端点**: `GET /api/auth/me`
**需要认证**: ✅

**响应**:
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "username": "john_doe",
  "displayName": "John Doe",
  "email": "john@example.com",
  "avatar": "avatar_url",
  "isOnline": true,
  "lastOnline": "2026-03-10T10:00:00Z"
}
```

**示例**:
```bash
curl http://localhost:5185/api/auth/me \
  -H "Authorization: Bearer your_jwt_token"
```

```javascript
const response = await fetch('http://localhost:5185/api/auth/me', {
  headers: { 'Authorization': 'Bearer your_jwt_token' }
});
const user = await response.json();
```

---

### 3.3 用户相关

#### 3.3.1 搜索用户

**端点**: `GET /api/users/search`
**需要认证**: ✅

**查询参数**:
- `keyword` (string, 必填): 搜索关键词

**响应**:
```json
{
  "users": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "username": "john_doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "avatar": "avatar_url",
      "isOnline": true,
      "lastOnline": "2026-03-10T10:00:00Z"
    }
  ]
}
```

**示例**:
```bash
curl "http://localhost:5185/api/users/search?keyword=john" \
  -H "Authorization: Bearer your_jwt_token"
```

```javascript
const response = await fetch('http://localhost:5185/api/users/search?keyword=john', {
  headers: { 'Authorization': 'Bearer your_jwt_token' }
});
const data = await response.json();
```

#### 3.3.2 获取用户详情

**端点**: `GET /api/users/{id}`
**需要认证**: ✅

**路径参数**:
- `id` (Guid): 用户 ID

**响应**: 同 3.3.1 中的单个用户对象

**示例**:
```bash
curl http://localhost:5185/api/users/3fa85f64-5717-4562-b3fc-2c963f66afa6 \
  -H "Authorization: Bearer your_jwt_token"
```

#### 3.3.3 更新个人资料

**端点**: `PUT /api/users/profile`
**需要认证**: ✅

**请求体**:
```json
{
  "displayName": "New Display Name"
}
```

**响应**: 更新后的用户对象 (同 3.3.1)

**示例**:
```javascript
const response = await fetch('http://localhost:5185/api/users/profile', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ displayName: 'New Name' })
});
const updatedUser = await response.json();
```

---

### 3.4 好友相关

#### 3.4.1 获取好友列表

**端点**: `GET /api/friends`
**需要认证**: ✅

**响应**:
```json
{
  "friends": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "username": "jane_doe",
      "displayName": "Jane Doe",
      "email": "jane@example.com",
      "avatar": "avatar_url",
      "isOnline": false,
      "lastOnline": "2026-03-10T09:00:00Z",
      "remark": "同事"
    }
  ]
}
```

**示例**:
```javascript
const response = await fetch('http://localhost:5185/api/friends', {
  headers: { 'Authorization': 'Bearer your_jwt_token' }
});
const { friends } = await response.json();
```

#### 3.4.2 发送好友请求

**端点**: `POST /api/friends/requests`
**需要认证**: ✅

**请求体**:
```json
{
  "receiverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "你好,我想加你为好友"
}
```

**响应**: `204 No Content`

**示例**:
```javascript
await fetch('http://localhost:5185/api/friends/requests', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    receiverId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    message: '你好,我想加你为好友'
  })
});
```

#### 3.4.3 获取收到的好友请求

**端点**: `GET /api/friends/requests`
**需要认证**: ✅

**响应**:
```json
{
  "requests": [
    {
      "id": "request_id",
      "sender": {
        "id": "sender_id",
        "username": "john_doe",
        "displayName": "John Doe",
        "email": "john@example.com",
        "avatar": "avatar_url",
        "isOnline": true,
        "lastOnline": "2026-03-10T10:00:00Z"
      },
      "receiver": {
        "id": "receiver_id",
        "username": "jane_doe",
        "displayName": "Jane Doe",
        "email": "jane@example.com",
        "avatar": "avatar_url",
        "isOnline": false,
        "lastOnline": "2026-03-10T09:00:00Z"
      },
      "message": "你好,我想加你为好友",
      "status": "Pending",
      "createdAt": "2026-03-10T10:00:00Z",
      "processedAt": null
    }
  ]
}
```

#### 3.4.4 获取发送的好友请求

**端点**: `GET /api/friends/requests/sent`
**需要认证**: ✅

**响应**: 同 3.4.3

#### 3.4.5 处理好友请求

**端点**: `PUT /api/friends/requests/{id}`
**需要认证**: ✅

**路径参数**:
- `id` (Guid): 好友请求 ID

**请求体**:
```json
{
  "accept": true
}
```

**响应**: `204 No Content`

**示例**:
```javascript
await fetch(`http://localhost:5185/api/friends/requests/${requestId}`, {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ accept: true })
});
```

#### 3.4.6 删除好友

**端点**: `DELETE /api/friends/{friendId}`
**需要认证**: ✅

**路径参数**:
- `friendId` (Guid): 好友用户 ID

**响应**: `204 No Content`

**示例**:
```javascript
await fetch(`http://localhost:5185/api/friends/${friendId}`, {
  method: 'DELETE',
  headers: { 'Authorization': 'Bearer your_jwt_token' }
});
```

---

### 3.5 私聊消息相关

#### 3.5.1 获取会话消息（游标分页）

**端点**: `GET /api/messages/private/conversations/{friendId}`
**需要认证**: ✅

**路径参数**:
- `friendId` (Guid): 好友用户 ID

**查询参数**:
- `before` (Guid, 可选): 获取此消息 ID 之前的消息（向前翻页，加载历史）
- `after` (Guid, 可选): 获取此消息 ID 之后的消息（向后翻页，加载新消息）
- `limit` (int, 可选, 默认: 50, 范围: 1-100): 每页数量

**参数说明**:
- `before` 和 `after` 互斥，不能同时提供
- 首次加载时不提供 `before` 和 `after`，返回最新的消息
- 使用 `before` 向前翻页加载更早的历史消息
- 使用 `after` 向后翻页加载更新的消息

**响应**:
```json
{
  "messages": [
    {
      "id": "message_id",
      "senderId": "sender_id",
      "receiverId": "receiver_id",
      "content": "你好",
      "type": "Text",
      "status": "Read",
      "deliveredAt": "2026-03-10T10:01:00Z",
      "readAt": "2026-03-10T10:02:00Z",
      "createdAt": "2026-03-10T10:00:00Z",
      "sender": { /* UserDto */ },
      "receiver": { /* UserDto */ }
    }
  ],
  "hasMore": true,
  "nextCursor": "next_message_id",
  "prevCursor": "prev_message_id"
}
```

**响应字段说明**:
- `messages`: 消息列表（按时间倒序，最新的在前）
- `hasMore`: 是否还有更多消息
- `nextCursor`: 用于 `?before={nextCursor}` 获取更早的消息
- `prevCursor`: 用于 `?after={prevCursor}` 获取更新的消息

**示例**:
```javascript
// 首次加载最新消息
const response = await fetch(
  `http://localhost:5185/api/messages/private/conversations/${friendId}?limit=50`,
  { headers: { 'Authorization': 'Bearer your_jwt_token' } }
);
const { messages, hasMore, nextCursor, prevCursor } = await response.json();

// 向前翻页加载更早的历史消息
if (hasMore && nextCursor) {
  const olderResponse = await fetch(
    `http://localhost:5185/api/messages/private/conversations/${friendId}?before=${nextCursor}&limit=50`,
    { headers: { 'Authorization': 'Bearer your_jwt_token' } }
  );
}

// 向后翻页加载更新的消息
if (prevCursor) {
  const newerResponse = await fetch(
    `http://localhost:5185/api/messages/private/conversations/${friendId}?after=${prevCursor}&limit=50`,
    { headers: { 'Authorization': 'Bearer your_jwt_token' } }
  );
}
```

#### 3.5.2 发送私聊消息 (HTTP API)

**端点**: `POST /api/messages/private/send`
**需要认证**: ✅

**请求体**:
```json
{
  "receiverId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "content": "你好",
  "type": "Text"
}
```

**响应**: 发送的消息对象 (同 3.5.1)

**注意**: 实时消息发送建议使用 SignalR,此端点主要用于非实时场景或测试

**示例**:
```javascript
const response = await fetch('http://localhost:5185/api/messages/private/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    receiverId: 'friend_user_id',
    content: '你好',
    type: 'Text'
  })
});
const message = await response.json();
```

#### 3.5.3 获取私聊未读消息数

**端点**: `GET /api/messages/private/unread`
**需要认证**: ✅

**响应**:
```json
{
  "totalUnread": 5,
  "unreadByUser": {
    "user_id_1": 3,
    "user_id_2": 2
  }
}
```

#### 3.5.4 标记消息为已读

**端点**: `PUT /api/messages/private/{messageId}/read`
**需要认证**: ✅

**路径参数**:
- `messageId` (Guid): 消息 ID

**响应**: `204 No Content`

#### 3.5.5 标记所有消息为已读

**端点**: `PUT /api/messages/private/conversations/{friendId}/read-all`
**需要认证**: ✅

**路径参数**:
- `friendId` (Guid): 好友用户 ID

**响应**: `204 No Content`

#### 3.5.6 获取统一未读消息数 (私聊 + 群聊)

**端点**: `GET /api/messages/unread`
**需要认证**: ✅

**响应**:
```json
{
  "totalPrivateUnread": 5,
  "totalGroupUnread": 0,
  "privateUnreadByUser": {
    "user_id_1": 3,
    "user_id_2": 2
  },
  "groupUnreadByGroup": {}
}
```

**说明**: 聚合私聊和群聊的未读消息统计。当前版本群聊未读数为 0 (预留功能)

---

### 3.6 群组相关

#### 3.6.1 创建群组

**端点**: `POST /api/groups`
**需要认证**: ✅

**请求体**:
```json
{
  "name": "技术交流群",
  "avatar": "group_avatar_url",
  "description": "讨论技术问题的群组",
  "memberIds": ["user_id_1", "user_id_2"],
  "isPublic": true
}
```

**响应**:
```json
{
  "id": "group_id",
  "name": "技术交流群",
  "avatar": "group_avatar_url",
  "description": "讨论技术问题的群组",
  "ownerId": "owner_id",
  "maxMembers": 500,
  "memberCount": 3,
  "groupNumber": 123456,
  "isPublic": true,
  "createdAt": "2026-03-10T10:00:00Z",
  "updatedAt": null
}
```

**示例**:
```javascript
const response = await fetch('http://localhost:5185/api/groups', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '技术交流群',
    avatar: 'group_avatar_url',
    description: '讨论技术问题的群组',
    memberIds: ['user_id_1', 'user_id_2'],
    isPublic: true
  })
});
const group = await response.json();
```

#### 3.6.2 获取用户加入的群组列表

**端点**: `GET /api/groups`
**需要认证**: ✅

**响应**:
```json
{
  "groups": [
    {
      "id": "group_id",
      "name": "技术交流群",
      "avatar": "group_avatar_url",
      "description": "讨论技术问题的群组",
      "ownerId": "owner_id",
      "maxMembers": 500,
      "memberCount": 10,
      "groupNumber": 123456,
      "isPublic": true,
      "createdAt": "2026-03-10T10:00:00Z",
      "updatedAt": null
    }
  ]
}
```

#### 3.6.3 获取群组详情

**端点**: `GET /api/groups/{id}`
**需要认证**: ✅

**路径参数**:
- `id` (Guid): 群组 ID

**响应**:
```json
{
  "group": {
    "id": "group_id",
    "name": "技术交流群",
    "avatar": "group_avatar_url",
    "description": "讨论技术问题的群组",
    "ownerId": "owner_id",
    "maxMembers": 500,
    "memberCount": 10,
    "groupNumber": 123456,
    "isPublic": true,
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": null
  },
  "members": [
    {
      "id": "member_id",
      "groupId": "group_id",
      "user": { /* UserDto */ },
      "role": "Owner",
      "nickname": "群主",
      "joinedAt": "2026-03-10T10:00:00Z"
    }
  ],
  "announcement": {
    "content": "欢迎加入技术交流群",
    "updatedAt": "2026-03-10T10:00:00Z",
    "updatedBy": { /* UserDto */ }
  }
}
```

#### 3.6.4 更新群组信息

**端点**: `PUT /api/groups/{id}`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `id` (Guid): 群组 ID

**请求体**:
```json
{
  "name": "新群名称",
  "avatar": "new_avatar_url",
  "description": "新的群组描述",
  "isPublic": false
}
```

**响应**: 更新后的群组对象 (同 3.6.1)

#### 3.6.5 删除群组

**端点**: `DELETE /api/groups/{id}`
**需要认证**: ✅
**权限要求**: 仅群主

**路径参数**:
- `id` (Guid): 群组 ID

**响应**: `204 No Content`

#### 3.6.6 添加群成员

**端点**: `POST /api/groups/{id}/members`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `id` (Guid): 群组 ID

**请求体**:
```json
{
  "userId": "user_id_to_add"
}
```

**响应**: `204 No Content`

#### 3.6.7 移除群成员

**端点**: `DELETE /api/groups/{id}/members/{userId}`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `id` (Guid): 群组 ID
- `userId` (Guid): 要移除的用户 ID

**响应**: `204 No Content`

#### 3.6.8 更新成员角色

**端点**: `PUT /api/groups/{id}/members/{userId}/role`
**需要认证**: ✅
**权限要求**: 仅群主

**路径参数**:
- `id` (Guid): 群组 ID
- `userId` (Guid): 成员用户 ID

**请求体**:
```json
{
  "role": "Admin"
}
```

**可选角色**:
- `Owner`: 群主
- `Admin`: 管理员
- `Member`: 普通成员

**响应**: `204 No Content`

#### 3.6.9 获取群聊消息（游标分页）

**端点**: `GET /api/messages/group/{groupId}`
**需要认证**: ✅

**路径参数**:
- `groupId` (Guid): 群组 ID

**查询参数**:
- `before` (Guid, 可选): 获取此消息 ID 之前的消息（向前翻页，加载历史）
- `after` (Guid, 可选): 获取此消息 ID 之后的消息（向后翻页，加载新消息）
- `limit` (int, 可选, 默认: 50, 范围: 1-100): 每页数量

**参数说明**:
- `before` 和 `after` 互斥，不能同时提供
- 首次加载时不提供 `before` 和 `after`，返回最新的消息
- 使用 `before` 向前翻页加载更早的历史消息
- 使用 `after` 向后翻页加载更新的消息

**响应**:
```json
{
  "messages": [
    {
      "id": "message_id",
      "groupId": "group_id",
      "sender": { /* UserDto */ },
      "content": "大家好",
      "type": "Text",
      "replyTo": null,
      "createdAt": "2026-03-10T10:00:00Z"
    }
  ],
  "hasMore": true,
  "nextCursor": "next_message_id",
  "prevCursor": "prev_message_id"
}
```

**响应字段说明**:
- `messages`: 消息列表（按时间倒序，最新的在前）
- `hasMore`: 是否还有更多消息
- `nextCursor`: 用于 `?before={nextCursor}` 获取更早的消息
- `prevCursor`: 用于 `?after={prevCursor}` 获取更新的消息

**示例**:
```javascript
// 首次加载最新消息
const response = await fetch(
  `http://localhost:5185/api/messages/group/${groupId}?limit=50`,
  { headers: { 'Authorization': 'Bearer your_jwt_token' } }
);
const { messages, hasMore, nextCursor, prevCursor } = await response.json();

// 向前翻页加载更早的历史消息
if (hasMore && nextCursor) {
  const olderResponse = await fetch(
    `http://localhost:5185/api/messages/group/${groupId}?before=${nextCursor}&limit=50`,
    { headers: { 'Authorization': 'Bearer your_jwt_token' } }
  );
}

// 向后翻页加载更新的消息
if (prevCursor) {
  const newerResponse = await fetch(
    `http://localhost:5185/api/messages/group/${groupId}?after=${prevCursor}&limit=50`,
    { headers: { 'Authorization': 'Bearer your_jwt_token' } }
  );
}
```

#### 3.6.10 发送群聊消息 (HTTP API)

**端点**: `POST /api/messages/group/{groupId}/send`
**需要认证**: ✅

**路径参数**:
- `groupId` (Guid): 群组 ID

**请求体**:
```json
{
  "content": "大家好",
  "type": "Text",
  "replyToId": null
}
```

**消息类型**:
- `Text`: 文本消息
- `Image`: 图片消息
- `File`: 文件消息
- `System`: 系统消息

**响应**: 发送的消息对象 (同 3.6.9)

**注意**: 实时消息发送建议使用 SignalR,此端点主要用于非实时场景或测试

#### 3.6.11 离开群组

**端点**: `POST /api/groups/{id}/leave`
**需要认证**: ✅

**路径参数**:
- `id` (Guid): 群组 ID

**响应**: `204 No Content`

**注意**: 群主不能离开群组,必须先转让群主或解散群组

#### 3.6.12 搜索群组

**端点**: `GET /api/groups/search/{groupNumber}`
**需要认证**: ✅

**路径参数**:
- `groupNumber` (int): 群号

**响应**:
```json
{
  "group": {
    "id": "group_id",
    "name": "技术交流群",
    "avatar": "group_avatar_url",
    "description": "讨论技术问题的群组",
    "ownerId": "owner_id",
    "maxMembers": 500,
    "memberCount": 10,
    "groupNumber": 123456,
    "isPublic": true,
    "createdAt": "2026-03-10T10:00:00Z",
    "updatedAt": null
  },
  "isMember": false
}
```

#### 3.6.13 加入公开群组

**端点**: `POST /api/groups/join`
**需要认证**: ✅

**请求体**:
```json
{
  "groupNumber": 123456
}
```

**响应**: `204 No Content`

**注意**: 仅适用于公开群组,私有群组需要发送加入请求

#### 3.6.14 设置群公告

**端点**: `PUT /api/groups/{id}/announcement`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `id` (Guid): 群组 ID

**请求体**:
```json
{
  "content": "本周五晚上 8 点技术分享会"
}
```

**响应**: `204 No Content`

#### 3.6.15 清除群公告

**端点**: `DELETE /api/groups/{id}/announcement`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `id` (Guid): 群组 ID

**响应**: `204 No Content`

#### 3.6.16 发送群组加入请求

**端点**: `POST /api/groups/join-request`
**需要认证**: ✅

**请求体**:
```json
{
  "groupNumber": 123456,
  "message": "我想加入这个群组"
}
```

**响应**: `204 No Content`

#### 3.6.17 获取群组加入请求列表

**端点**: `GET /api/groups/{id}/join-requests`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `id` (Guid): 群组 ID

**响应**:
```json
{
  "requests": [
    {
      "id": "request_id",
      "group": { /* GroupDto */ },
      "user": { /* UserDto */ },
      "message": "我想加入这个群组",
      "status": "Pending",
      "createdAt": "2026-03-10T10:00:00Z",
      "processedAt": null,
      "processedBy": null
    }
  ]
}
```

#### 3.6.18 获取我的群组加入请求

**端点**: `GET /api/groups/my-join-requests`
**需要认证**: ✅

**响应**: 同 3.6.17

#### 3.6.19 处理群组加入请求

**端点**: `POST /api/groups/join-requests/{requestId}/process`
**需要认证**: ✅
**权限要求**: 群主或管理员

**路径参数**:
- `requestId` (Guid): 加入请求 ID

**请求体**:
```json
{
  "accept": true
}
```

**响应**: `204 No Content`

---

### 3.7 媒体文件相关

#### 3.7.1 上传文件

**端点**: `POST /api/media/upload`
**需要认证**: ✅
**Content-Type**: `multipart/form-data`

**请求参数**:
- `file` (File): 要上传的文件

**文件限制**:
- 最大文件大小: 10 MB
- 允许的文件类型: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

**响应**:
```json
{
  "fileName": "unique_file_name.jpg",
  "url": "http://localhost:5185/api/media/unique_file_name.jpg"
}
```

**错误码**:
- `400 Bad Request`: 文件为空、超过大小限制或文件类型不允许

**示例**:
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('http://localhost:5185/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_jwt_token'
  },
  body: formData
});
const { fileName, url } = await response.json();
```

#### 3.7.2 获取文件

**端点**: `GET /api/media/{filename}`
**需要认证**: ❌

**路径参数**:
- `filename` (string): 文件名

**响应**: 文件二进制流

**示例**:
```html
<img src="http://localhost:5185/api/media/unique_file_name.jpg" alt="Image">
```

---

## 4. SignalR 实时通讯

### 4.1 连接建立

#### 4.1.1 连接 URL

```
ws://localhost:5185/hubs/chat
```

#### 4.1.2 认证方式

SignalR 连接需要在建立时提供 JWT Token:

**方式 1: 查询参数**
```
ws://localhost:5185/hubs/chat?access_token=your_jwt_token
```

**方式 2: Header (推荐)**
```javascript
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5185/hubs/chat', {
    accessTokenFactory: () => 'your_jwt_token'
  })
  .build();
```

#### 4.1.3 连接生命周期

**连接成功后自动执行**:
1. 将用户 ID 与连接 ID 关联
2. 更新用户在线状态为 `true`
3. 通知其他用户该用户上线 (`UserOnline` 事件)
4. 自动加入用户所有群组的 SignalR Group

**断开连接时自动执行**:
1. 移除用户 ID 与连接 ID 的关联
2. 如果用户所有连接都断开,更新在线状态为 `false`
3. 通知其他用户该用户离线 (`UserOffline` 事件)

### 4.2 客户端可调用方法

#### 4.2.1 发送消息 (统一接口)

**方法名**: `SendMessage`

**参数**:
```typescript
{
  target: 'Private' | 'Group',  // 消息目标类型
  content: string,               // 消息内容
  type: 'Text' | 'Image' | 'File' | 'System',  // 消息类型
  receiverId?: string,           // 私聊接收者 ID (target=Private 时必填)
  groupId?: string,              // 群组 ID (target=Group 时必填)
  replyToId?: string             // 回复的消息 ID (仅群聊支持)
}
```

**示例 - 发送私聊消息**:
```javascript
await connection.invoke('SendMessage', {
  target: 'Private',
  content: '你好',
  type: 'Text',
  receiverId: 'receiver_user_id'
});
```

**示例 - 发送群聊消息**:
```javascript
await connection.invoke('SendMessage', {
  target: 'Group',
  content: '大家好',
  type: 'Text',
  groupId: 'group_id'
});
```

**示例 - 回复群聊消息**:
```javascript
await connection.invoke('SendMessage', {
  target: 'Group',
  content: '同意',
  type: 'Text',
  groupId: 'group_id',
  replyToId: 'original_message_id'
});
```

#### 4.2.2 标记消息为已读

**方法名**: `MarkAsRead`

**参数**:
- `messageId` (Guid): 消息 ID

**示例**:
```javascript
await connection.invoke('MarkAsRead', 'message_id');
```

#### 4.2.3 标记所有消息为已读

**方法名**: `MarkAllAsRead`

**参数**:
- `friendId` (Guid): 好友用户 ID

**示例**:
```javascript
await connection.invoke('MarkAllAsRead', 'friend_user_id');
```

#### 4.2.4 发送正在输入状态

**方法名**: `Typing`

**参数**:
- `receiverId` (Guid): 接收者用户 ID

**示例**:
```javascript
// 用户开始输入时调用
await connection.invoke('Typing', 'receiver_user_id');
```

#### 4.2.5 加入群组

**方法名**: `JoinGroup`

**参数**:
- `groupId` (Guid): 群组 ID

**说明**: 将当前连接加入指定群组的 SignalR Group,用于接收群聊消息

**示例**:
```javascript
await connection.invoke('JoinGroup', 'group_id');
```

#### 4.2.6 离开群组

**方法名**: `LeaveGroup`

**参数**:
- `groupId` (Guid): 群组 ID

**说明**: 将当前连接从指定群组的 SignalR Group 移除

**示例**:
```javascript
await connection.invoke('LeaveGroup', 'group_id');
```

### 4.3 服务端推送事件

#### 4.3.1 收到私聊消息

**事件名**: `ReceiveMessage`

**参数**:
```typescript
{
  id: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: 'Text' | 'Image' | 'File' | 'System',
  status: 'Sent' | 'Delivered' | 'Read',
  deliveredAt: string | null,
  readAt: string | null,
  createdAt: string,
  sender: UserDto,
  receiver: UserDto
}
```

**监听示例**:
```javascript
connection.on('ReceiveMessage', (message) => {
  console.log('收到私聊消息:', message);
  // 更新 UI 显示新消息
});
```

#### 4.3.2 收到群聊消息

**事件名**: `ReceiveGroupMessage`

**参数**:
```typescript
{
  id: string,
  groupId: string,
  sender: UserDto,
  content: string,
  type: 'Text' | 'Image' | 'File' | 'System',
  replyTo: GroupMessageDto | null,
  createdAt: string
}
```

**监听示例**:
```javascript
connection.on('ReceiveGroupMessage', (message) => {
  console.log('收到群聊消息:', message);
  // 更新群聊界面
});
```

#### 4.3.3 消息已发送 (回显)

**事件名**: `MessageSent`

**参数**: 同 4.3.1 (私聊消息对象)

**说明**: 发送者发送消息后会收到此事件,用于确认消息已成功发送

**监听示例**:
```javascript
connection.on('MessageSent', (message) => {
  console.log('消息已发送:', message);
  // 更新消息状态为已发送
});
```

#### 4.3.4 消息已读

**事件名**: `MessageRead`

**参数**:
- `messageId` (Guid): 消息 ID

**说明**: 接收者标记消息为已读后,发送者会收到此事件

**监听示例**:
```javascript
connection.on('MessageRead', (messageId) => {
  console.log('消息已读:', messageId);
  // 更新消息状态为已读
});
```

#### 4.3.5 所有消息已读

**事件名**: `AllMessagesRead`

**参数**:
- `userId` (Guid): 标记已读的用户 ID

**说明**: 接收者标记所有消息为已读后,发送者会收到此事件

**监听示例**:
```javascript
connection.on('AllMessagesRead', (userId) => {
  console.log('所有消息已读:', userId);
  // 更新与该用户的所有消息状态为已读
});
```

#### 4.3.6 用户上线

**事件名**: `UserOnline`

**参数**:
- `userId` (Guid): 上线的用户 ID

**监听示例**:
```javascript
connection.on('UserOnline', (userId) => {
  console.log('用户上线:', userId);
  // 更新好友列表中该用户的在线状态
});
```

#### 4.3.7 用户离线

**事件名**: `UserOffline`

**参数**:
- `userId` (Guid): 离线的用户 ID

**监听示例**:
```javascript
connection.on('UserOffline', (userId) => {
  console.log('用户离线:', userId);
  // 更新好友列表中该用户的离线状态
});
```

#### 4.3.8 用户正在输入

**事件名**: `UserTyping`

**参数**:
- `userId` (Guid): 正在输入的用户 ID

**监听示例**:
```javascript
connection.on('UserTyping', (userId) => {
  console.log('用户正在输入:', userId);
  // 显示 "对方正在输入..." 提示
});
```

#### 4.3.9 收到好友请求

**事件名**: `FriendRequestReceived`

**参数**:
```typescript
{
  id: string,
  sender: UserDto,
  receiver: UserDto,
  message: string | null,
  status: 'Pending',
  createdAt: string,
  processedAt: null
}
```

**监听示例**:
```javascript
connection.on('FriendRequestReceived', (request) => {
  console.log('收到好友请求:', request);
  // 显示好友请求通知
});
```

#### 4.3.10 好友请求已处理

**事件名**: `FriendRequestProcessed`

**参数**: 同 4.3.9 (好友请求对象,status 为 'Accepted' 或 'Rejected')

**监听示例**:
```javascript
connection.on('FriendRequestProcessed', (request) => {
  console.log('好友请求已处理:', request);
  // 更新好友请求状态
});
```

#### 4.3.11 好友关系已建立

**事件名**: `FriendAdded`

**参数**:
```typescript
{
  userId: string,        // 对方用户 ID
  friendId: string,      // 自己的用户 ID
  friend: FriendDto      // 好友信息
}
```

**监听示例**:
```javascript
connection.on('FriendAdded', (data) => {
  console.log('好友关系已建立:', data);
  // 更新好友列表
});
```

#### 4.3.12 收到群组加入请求

**事件名**: `GroupJoinRequestReceived`

**参数**:
```typescript
{
  id: string,
  group: GroupDto,
  user: UserDto,
  message: string | null,
  status: 'Pending',
  createdAt: string,
  processedAt: null,
  processedBy: null
}
```

**说明**: 仅群主和管理员会收到此事件

**监听示例**:
```javascript
connection.on('GroupJoinRequestReceived', (request) => {
  console.log('收到群组加入请求:', request);
  // 显示加入请求通知
});
```

#### 4.3.13 群组加入请求已处理

**事件名**: `GroupJoinRequestProcessed`

**参数**: 同 4.3.12 (加入请求对象,status 为 'Accepted' 或 'Rejected')

**监听示例**:
```javascript
connection.on('GroupJoinRequestProcessed', (request) => {
  console.log('群组加入请求已处理:', request);
  // 更新加入请求状态
});
```

#### 4.3.14 新成员加入群组

**事件名**: `GroupMemberJoined`

**参数**:
```typescript
{
  id: string,
  groupId: string,
  user: UserDto,
  role: 'Member',
  nickname: string | null,
  joinedAt: string
}
```

**说明**: 群组所有成员会收到此事件

**监听示例**:
```javascript
connection.on('GroupMemberJoined', (member) => {
  console.log('新成员加入群组:', member);
  // 更新群成员列表
});
```

### 4.4 完整连接示例

```javascript
// 1. 创建连接
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5185/hubs/chat', {
    accessTokenFactory: () => localStorage.getItem('jwt_token')
  })
  .withAutomaticReconnect()  // 自动重连
  .configureLogging(signalR.LogLevel.Information)
  .build();

// 2. 注册事件监听
connection.on('ReceiveMessage', (message) => {
  console.log('收到私聊消息:', message);
});

connection.on('ReceiveGroupMessage', (message) => {
  console.log('收到群聊消息:', message);
});

connection.on('UserOnline', (userId) => {
  console.log('用户上线:', userId);
});

connection.on('UserOffline', (userId) => {
  console.log('用户离线:', userId);
});

// 3. 启动连接
try {
  await connection.start();
  console.log('SignalR 连接成功');
} catch (err) {
  console.error('SignalR 连接失败:', err);
}

// 4. 发送消息
await connection.invoke('SendMessage', {
  target: 'Private',
  content: '你好',
  type: 'Text',
  receiverId: 'receiver_user_id'
});

// 5. 断开连接
await connection.stop();
```

---

## 5. 数据结构定义

### 5.1 用户相关

#### UserDto
```typescript
{
  id: string,              // 用户 ID (Guid)
  username: string,        // 用户名
  displayName: string,     // 显示名称
  email: string | null,    // 邮箱
  avatar: string | null,   // 头像 URL
  isOnline: boolean,       // 是否在线
  lastOnline: string | null  // 最后在线时间 (ISO 8601)
}
```

#### FriendDto
```typescript
{
  id: string,
  username: string,
  displayName: string,
  email: string | null,
  avatar: string | null,
  isOnline: boolean,
  lastOnline: string | null,
  remark: string | null    // 好友备注
}
```

### 5.2 消息相关

#### PrivateMessageDto
```typescript
{
  id: string,
  senderId: string,
  receiverId: string,
  content: string,
  type: 'Text' | 'Image' | 'File' | 'System',
  status: 'Sent' | 'Delivered' | 'Read',
  deliveredAt: string | null,
  readAt: string | null,
  createdAt: string,
  sender: UserDto,
  receiver: UserDto
}
```

#### GroupMessageDto
```typescript
{
  id: string,
  groupId: string,
  sender: UserDto,
  content: string,
  type: 'Text' | 'Image' | 'File' | 'System',
  replyTo: GroupMessageDto | null,  // 回复的消息
  createdAt: string
}
```

#### MessageType 枚举
- `Text`: 文本消息
- `Image`: 图片消息 (content 为图片 URL)
- `File`: 文件消息 (content 为文件 URL)
- `System`: 系统消息

#### MessageStatus 枚举 (仅私聊)
- `Sent`: 已发送
- `Delivered`: 已送达
- `Read`: 已读

### 5.3 好友相关

#### FriendRequestDto
```typescript
{
  id: string,
  sender: UserDto,
  receiver: UserDto,
  message: string | null,  // 请求附言
  status: 'Pending' | 'Accepted' | 'Rejected',
  createdAt: string,
  processedAt: string | null
}
```

### 5.4 群组相关

#### GroupDto
```typescript
{
  id: string,
  name: string,
  avatar: string | null,
  description: string | null,
  ownerId: string,
  maxMembers: number,      // 最大成员数 (默认 500)
  memberCount: number,     // 当前成员数
  groupNumber: number,     // 群号 (唯一)
  isPublic: boolean,       // 是否公开
  createdAt: string,
  updatedAt: string | null
}
```

#### GroupMemberDto
```typescript
{
  id: string,
  groupId: string,
  user: UserDto,
  role: 'Owner' | 'Admin' | 'Member',
  nickname: string | null,  // 群昵称
  joinedAt: string
}
```

#### GroupAnnouncementDto
```typescript
{
  content: string,
  updatedAt: string,
  updatedBy: UserDto
}
```

#### GroupJoinRequestDto
```typescript
{
  id: string,
  group: GroupDto,
  user: UserDto,
  message: string | null,
  status: 'Pending' | 'Accepted' | 'Rejected',
  createdAt: string,
  processedAt: string | null,
  processedBy: UserDto | null
}
```

### 5.5 响应包装

#### 游标分页响应 (PrivateMessagePageResponse)
```typescript
{
  messages: PrivateMessageDto[],
  hasMore: boolean,
  nextCursor: string | null,  // 用于 ?before={nextCursor} 获取更早的消息
  prevCursor: string | null   // 用于 ?after={prevCursor} 获取更新的消息
}
```

#### 游标分页响应 (GroupMessagePageResponse)
```typescript
{
  messages: GroupMessageDto[],
  hasMore: boolean,
  nextCursor: string | null,  // 用于 ?before={nextCursor} 获取更早的消息
  prevCursor: string | null   // 用于 ?after={prevCursor} 获取更新的消息
}
```

#### 列表响应
```typescript
// FriendListResponse
{ friends: FriendDto[] }

// GroupListResponse
{ groups: GroupDto[] }

// FriendRequestListResponse
{ requests: FriendRequestDto[] }

// GroupJoinRequestListResponse
{ requests: GroupJoinRequestDto[] }
```

### 5.6 字段验证规则

#### 用户相关
- `username`: 3-20 字符,仅字母、数字、下划线
- `displayName`: 1-50 字符
- `email`: 有效的邮箱格式

#### 消息相关
- `content`: 1-5000 字符 (文本消息)
- `content`: 有效的 URL (图片/文件消息)

#### 群组相关
- `name`: 1-50 字符
- `description`: 最多 500 字符
- `maxMembers`: 2-500

---

## 6. 错误处理

### 6.1 标准错误响应格式

所有 API 错误都遵循统一的响应格式:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "field_name": ["Error message"]
  },
  "traceId": "00-trace-id-00"
}
```

### 6.2 HTTP 状态码

| 状态码 | 说明 | 常见场景 |
|--------|------|----------|
| 200 OK | 请求成功 | GET 请求成功返回数据 |
| 201 Created | 资源创建成功 | POST 创建资源成功 |
| 204 No Content | 请求成功但无返回内容 | PUT/DELETE 操作成功 |
| 400 Bad Request | 请求参数错误 | 验证失败、参数缺失 |
| 401 Unauthorized | 未认证 | Token 缺失或无效 |
| 403 Forbidden | 无权限 | 权限不足 |
| 404 Not Found | 资源不存在 | 用户、群组、消息不存在 |
| 409 Conflict | 资源冲突 | 重复添加好友、重复加入群组 |
| 500 Internal Server Error | 服务器错误 | 未预期的服务器异常 |

### 6.3 常见错误码

#### 认证错误
```json
{
  "status": 401,
  "title": "Unauthorized",
  "detail": "Invalid or expired token"
}
```

#### 验证错误
```json
{
  "status": 400,
  "title": "Validation Error",
  "errors": {
    "displayName": ["Display name is required"],
    "content": ["Content must be between 1 and 5000 characters"]
  }
}
```

#### 资源不存在
```json
{
  "status": 404,
  "title": "Not Found",
  "detail": "User with ID '...' not found"
}
```

#### 权限不足
```json
{
  "status": 403,
  "title": "Forbidden",
  "detail": "You do not have permission to perform this action"
}
```

#### 业务逻辑错误
```json
{
  "status": 400,
  "title": "Business Error",
  "detail": "Cannot send message to non-friend user"
}
```

### 6.4 SignalR 错误处理

SignalR 方法调用失败会抛出异常:

```javascript
try {
  await connection.invoke('SendMessage', messageData);
} catch (err) {
  console.error('发送消息失败:', err.message);
  // err.message 包含错误详情
}
```

常见 SignalR 错误:
- `User ID not found in claims`: Token 无效或已过期
- `您不是该群组的成员`: 尝试发送消息到未加入的群组
- `ReceiverId is required for private messages`: 私聊消息缺少接收者 ID

---

## 7. 使用场景示例

### 7.1 用户登录流程

```javascript
// 1. 通过 OAuth 获取 access_token (假设已完成)
const oauthToken = 'oauth_access_token_from_provider';

// 2. 使用 OAuth token 登录获取 JWT
const loginResponse = await fetch('http://localhost:5185/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ oAuthAccessToken: oauthToken })
});
const { accessToken, refreshToken, user } = await loginResponse.json();

// 3. 保存 token
localStorage.setItem('jwt_token', accessToken);
localStorage.setItem('refresh_token', refreshToken);

// 4. 建立 SignalR 连接
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5185/hubs/chat', {
    accessTokenFactory: () => localStorage.getItem('jwt_token')
  })
  .withAutomaticReconnect()
  .build();

await connection.start();
console.log('登录成功,用户:', user);
```

### 7.2 发送私聊消息

```javascript
// 方式 1: 通过 SignalR (推荐,实时性更好)
await connection.invoke('SendMessage', {
  target: 'Private',
  content: '你好,在吗?',
  type: 'Text',
  receiverId: 'friend_user_id'
});

// 监听消息发送成功
connection.on('MessageSent', (message) => {
  console.log('消息已发送:', message);
  // 更新 UI 显示消息
});

// 监听接收消息
connection.on('ReceiveMessage', (message) => {
  console.log('收到新消息:', message);
  // 更新聊天界面
});
```

### 7.3 创建群组并邀请成员

```javascript
// 1. 创建群组
const createResponse = await fetch('http://localhost:5185/api/groups', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: '技术交流群',
    avatar: 'group_avatar_url',
    description: '讨论技术问题',
    memberIds: ['user_id_1', 'user_id_2'],
    isPublic: true
  })
});
const group = await createResponse.json();

// 2. 加入群组的 SignalR Group
await connection.invoke('JoinGroup', group.id);

// 3. 发送群聊消息
await connection.invoke('SendMessage', {
  target: 'Group',
  content: '欢迎大家加入!',
  type: 'Text',
  groupId: group.id
});
```

### 7.4 接收实时消息

```javascript
// 建立连接后注册所有事件监听
const connection = new signalR.HubConnectionBuilder()
  .withUrl('http://localhost:5185/hubs/chat', {
    accessTokenFactory: () => localStorage.getItem('jwt_token')
  })
  .withAutomaticReconnect()
  .build();

// 私聊消息
connection.on('ReceiveMessage', (message) => {
  // 显示新消息通知
  showNotification(`${message.sender.displayName}: ${message.content}`);
  
  // 更新聊天界面
  updateChatUI(message);
  
  // 如果当前正在查看该会话,自动标记为已读
  if (currentChatUserId === message.senderId) {
    connection.invoke('MarkAsRead', message.id);
  }
});

// 群聊消息
connection.on('ReceiveGroupMessage', (message) => {
  showNotification(`[${message.groupId}] ${message.sender.displayName}: ${message.content}`);
  updateGroupChatUI(message);
});

// 用户状态变化
connection.on('UserOnline', (userId) => {
  updateUserStatus(userId, true);
});

connection.on('UserOffline', (userId) => {
  updateUserStatus(userId, false);
});

// 正在输入提示
connection.on('UserTyping', (userId) => {
  showTypingIndicator(userId);
  // 3 秒后自动隐藏
  setTimeout(() => hideTypingIndicator(userId), 3000);
});

// 好友请求
connection.on('FriendRequestReceived', (request) => {
  showNotification(`${request.sender.displayName} 请求添加你为好友`);
  updateFriendRequestList();
});

await connection.start();
```

### 7.5 上传并发送图片消息

```javascript
// 1. 上传图片
const formData = new FormData();
formData.append('file', imageFile);

const uploadResponse = await fetch('http://localhost:5185/api/media/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
  },
  body: formData
});
const { url } = await uploadResponse.json();

// 2. 发送图片消息
await connection.invoke('SendMessage', {
  target: 'Private',
  content: url,  // 图片 URL 作为消息内容
  type: 'Image',
  receiverId: 'friend_user_id'
});
```

### 7.6 处理 Token 过期

```javascript
// 拦截 401 错误并刷新 token
async function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem('jwt_token');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Token 过期,尝试刷新
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    const refreshResponse = await fetch('http://localhost:5185/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    
    if (refreshResponse.ok) {
      const { accessToken, refreshToken: newRefreshToken } = await refreshResponse.json();
      localStorage.setItem('jwt_token', accessToken);
      localStorage.setItem('refresh_token', newRefreshToken);
      
      // 重试原请求
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`
        }
      });
    } else {
      // 刷新失败,跳转到登录页
      window.location.href = '/login';
    }
  }
  
  return response;
}
```

---

## 8. 附录

### 8.1 环境变量配置

#### appsettings.json 配置项

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=im_sharp;User ID=postgres;Password=P@ssword;"
  },
  "Jwt": {
    "Secret": "your_jwt_secret_key_at_least_32_characters",
    "Issuer": "IMSharp",
    "Audience": "IMSharp.Client",
    "ExpirationMinutes": 1440,
    "RefreshExpirationDays": 7
  },
  "OAuth": {
    "Provider": "LocalOAuth",
    "ClientId": "im_sharp",
    "ClientSecret": "",
    "AuthorizationEndpoint": "http://localhost:5001/connect/authorize",
    "TokenEndpoint": "http://localhost:5001/connect/token",
    "UserInfoEndpoint": "http://localhost:5001/connect/userinfo"
  },
  "Storage": {
    "Provider": "Local",
    "Local": {
      "RootPath": "wwwroot/uploads",
      "MaxFileSizeMB": 10,
      "AllowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"]
    }
  }
}
```

### 8.2 数据库连接信息

- **数据库类型**: PostgreSQL
- **主机**: localhost
- **端口**: 5432
- **数据库名**: im_sharp
- **用户名**: postgres
- **密码**: P@ssword
- **Docker 容器名**: pgsql

### 8.3 常见问题 FAQ

#### Q1: SignalR 连接失败怎么办?

**A**: 检查以下几点:
1. JWT Token 是否有效且未过期
2. 网络连接是否正常
3. 服务端是否正常运行
4. 浏览器控制台是否有 CORS 错误

#### Q2: 如何处理消息重复?

**A**: 每条消息都有唯一的 `id`,客户端应该:
1. 维护已接收消息的 ID 集合
2. 收到新消息时检查 ID 是否已存在
3. 如果已存在则忽略该消息

#### Q3: 如何实现消息撤回功能?

**A**: 当前版本不支持消息撤回,可以通过以下方式实现:
1. 发送一条 `System` 类型的消息,内容为 "消息已撤回"
2. 客户端根据消息类型隐藏原消息内容

#### Q4: 群聊消息是否支持已读回执?

**A**: 当前版本群聊消息不支持已读回执,仅私聊消息支持。

#### Q5: 如何实现消息搜索?

**A**: 当前版本不提供消息搜索 API,建议:
1. 客户端缓存历史消息到本地数据库
2. 使用本地全文搜索功能

#### Q6: 文件上传大小限制是多少?

**A**: 默认限制为 10 MB,可在 `appsettings.json` 中修改 `Storage:Local:MaxFileSizeMB` 配置。

#### Q7: 如何实现多设备同步?

**A**: 
1. 同一用户可以建立多个 SignalR 连接
2. 服务端会向用户的所有连接推送消息
3. 客户端需要处理消息去重

#### Q8: 如何获取历史消息?

**A**: 使用分页 API:
- 私聊: `GET /api/messages/private/conversations/{friendId}?pageNumber=1&pageSize=50`
- 群聊: `GET /api/messages/group/{groupId}?limit=50&before=2026-03-10T10:00:00Z`

#### Q9: SignalR 断线重连后需要做什么?

**A**: 
1. SignalR 会自动重连 (使用 `withAutomaticReconnect()`)
2. 重连成功后会自动重新加入所有群组
3. 建议重连后拉取最新消息以防遗漏

#### Q10: 如何实现@某人功能?

**A**: 
1. 在消息内容中使用特殊格式,如 `@[userId:displayName]`
2. 客户端解析消息内容并高亮显示
3. 被@的用户可以通过解析消息内容判断是否需要特殊提醒

---

## 9. 版本历史

### v1.2.0 (2026-03-11)

**消息分页重构 - 破坏性变更**

将私聊和群聊消息的分页方式从传统的页码分页统一替换为基于消息 ID 的游标分页。

**API 变更**:

私聊消息:
- `GET /api/messages/private/conversations/{friendId}` 查询参数变更:
  - 移除: `pageNumber`, `pageSize`
  - 新增: `before` (Guid), `after` (Guid), `limit` (int, 1-100)
- 响应格式变更:
  - 移除: `totalCount`, `pageNumber`, `pageSize`, `totalPages`
  - 新增: `hasMore` (bool), `nextCursor` (Guid?), `prevCursor` (Guid?)

群聊消息:
- `GET /api/messages/group/{groupId}` 查询参数变更:
  - `before` 类型从 `DateTimeOffset` 改为 `Guid`
  - 新增: `after` (Guid)
  - `limit` 范围限制为 1-100
- 响应格式变更:
  - 从 `GroupMessagesResponse` 改为 `GroupMessagePageResponse`
  - 新增: `hasMore` (bool), `nextCursor` (Guid?), `prevCursor` (Guid?)

**设计优势**:
- ✅ 一致性 - 私聊和群聊使用统一的游标分页方式
- ✅ 性能优化 - 利用 `Guid.CreateVersion7()` 的时间排序特性，避免 COUNT 查询
- ✅ 双向加载 - 支持向前加载历史和向后加载新消息
- ✅ 实时友好 - 更适合实时消息场景，无需重新计算页码

**数据库优化**:
- 新增索引: `idx_private_message_conversation_id (SenderId, ReceiverId, Id)`
- 新增索引: `idx_group_message_group_id (GroupId, Id)`

**迁移指南**:

旧代码（页码分页）:
```javascript
// 首次加载
const response = await fetch(
  `/api/messages/private/conversations/${friendId}?pageNumber=1&pageSize=50`
);
const { messages, totalPages } = await response.json();

// 加载下一页
const nextResponse = await fetch(
  `/api/messages/private/conversations/${friendId}?pageNumber=2&pageSize=50`
);
```

新代码（游标分页）:
```javascript
// 首次加载
const response = await fetch(
  `/api/messages/private/conversations/${friendId}?limit=50`
);
const { messages, hasMore, nextCursor } = await response.json();

// 加载更早的消息
if (hasMore && nextCursor) {
  const olderResponse = await fetch(
    `/api/messages/private/conversations/${friendId}?before=${nextCursor}&limit=50`
  );
}

// 加载更新的消息
if (prevCursor) {
  const newerResponse = await fetch(
    `/api/messages/private/conversations/${friendId}?after=${prevCursor}&limit=50`
  );
}
```

### v1.1.0 (2026-03-11)

**API 重构 - 破坏性变更**

重构 MessagesController 以统一处理私聊和群聊消息。所有消息相关端点现在集中在 `/api/messages` 路由下。

**端点变更**:

私聊消息:
- `GET /api/messages/conversation/{friendId}` → `GET /api/messages/private/conversations/{friendId}`
- `GET /api/messages/unread` → `GET /api/messages/private/unread`
- `PUT /api/messages/{id}/read` → `PUT /api/messages/private/{messageId}/read`
- `PUT /api/messages/read-all/{friendId}` → `PUT /api/messages/private/conversations/{friendId}/read-all`

群聊消息:
- `GET /api/groups/{id}/messages` → `GET /api/messages/group/{groupId}`
- `POST /api/groups/{id}/messages` → `POST /api/messages/group/{groupId}/send`

**新增端点**:
- `POST /api/messages/private/send` - 发送私聊消息 (HTTP API)
- `GET /api/messages/unread` - 获取统一未读数 (私聊 + 群聊)

**设计优势**:
- ✅ 职责清晰 - MessagesController 专注消息,GroupsController 专注群组管理
- ✅ RESTful 风格 - 路径语义化,符合 HTTP 规范
- ✅ 一致性 - 私聊和群聊消息使用统一的路由模式

详细迁移指南请参考项目根目录的 `API_MIGRATION.md` 文件。

### v1.0.0 (2026-03-10)

**初始版本**
- ✅ 用户认证 (JWT + OAuth 2.0)
- ✅ 一对一私聊
- ✅ 群组聊天
- ✅ 好友管理
- ✅ 实时消息推送 (SignalR)
- ✅ 文件上传
- ✅ 在线状态
- ✅ 消息已读回执 (私聊)
- ✅ 正在输入提示

**已知限制**
- 不支持消息撤回
- 不支持消息编辑
- 不支持消息搜索
- 群聊消息不支持已读回执
- 不支持语音/视频通话

---

## 10. 联系方式

如有问题或建议,请联系开发团队:

- **项目地址**: https://github.com/your-org/imsharp
- **问题反馈**: https://github.com/your-org/imsharp/issues
- **邮箱**: support@imsharp.com

---

**文档生成时间**: 2026-03-11
**API 版本**: v1.2.0
**文档版本**: v1.2.0
