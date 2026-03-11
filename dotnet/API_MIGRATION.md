# MessagesController API 路由变更文档

## 概述

MessagesController 已重构为统一处理私聊和群聊消息的控制器。所有消息相关端点现在集中在 `/api/messages` 路由下。

## 破坏性变更

### 私聊消息端点变更

| 旧端点 | 新端点 | 说明 |
|--------|--------|------|
| `GET /api/messages/conversation/{friendId}` | `GET /api/messages/private/conversations/{friendId}` | 获取私聊会话 |
| `GET /api/messages/unread` | `GET /api/messages/private/unread` | 获取私聊未读数 |
| `PUT /api/messages/{id}/read` | `PUT /api/messages/private/{messageId}/read` | 标记消息已读 |
| `PUT /api/messages/read-all/{friendId}` | `PUT /api/messages/private/conversations/{friendId}/read-all` | 标记所有消息已读 |

### 群聊消息端点变更

| 旧端点 | 新端点 | 说明 |
|--------|--------|------|
| `GET /api/groups/{id}/messages` | `GET /api/messages/group/{groupId}` | 获取群聊消息 |
| `POST /api/groups/{id}/messages` | `POST /api/messages/group/{groupId}/send` | 发送群聊消息 |

### 新增端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/messages/private/send` | POST | 发送私聊消息 (HTTP API) |
| `/api/messages/unread` | GET | 获取统一未读数 (私聊 + 群聊) |

## 完整 API 列表

### 私聊消息

```
GET    /api/messages/private/conversations/{friendId}
       查询参数: pageNumber (默认1), pageSize (默认50)
       返回: ConversationResponse

POST   /api/messages/private/send
       请求体: SendPrivateMessageRequest
       返回: PrivateMessageDto

GET    /api/messages/private/unread
       返回: UnreadCountResponse

PUT    /api/messages/private/{messageId}/read
       返回: 204 No Content

PUT    /api/messages/private/conversations/{friendId}/read-all
       返回: 204 No Content
```

### 群聊消息

```
GET    /api/messages/group/{groupId}
       查询参数: limit (默认50), before (DateTimeOffset?)
       返回: GroupMessagesResponse

POST   /api/messages/group/{groupId}/send
       请求体: SendGroupMessageRequest
       返回: GroupMessageDto
```

### 统一端点

```
GET    /api/messages/unread
       返回: UnifiedUnreadCountResponse
       {
         "totalPrivateUnread": 5,
         "totalGroupUnread": 0,
         "privateUnreadByUser": { "guid": 3, ... },
         "groupUnreadByGroup": {}
       }
```

## 迁移指南

### 客户端更新步骤

1. **更新私聊消息端点**
   ```typescript
   // 旧代码
   GET /api/messages/conversation/${friendId}

   // 新代码
   GET /api/messages/private/conversations/${friendId}
   ```

2. **更新群聊消息端点**
   ```typescript
   // 旧代码
   GET /api/groups/${groupId}/messages
   POST /api/groups/${groupId}/messages

   // 新代码
   GET /api/messages/group/${groupId}
   POST /api/messages/group/${groupId}/send
   ```

3. **使用新的统一未读数端点**
   ```typescript
   // 新功能
   GET /api/messages/unread
   // 返回私聊和群聊的未读数统计
   ```

## 注意事项

1. **实时消息发送**: HTTP API 端点主要用于非实时场景或测试。实时消息发送应使用 SignalR (`ChatHub.SendPrivateMessage` 和 `ChatHub.SendGroupMessage`)

2. **群聊未读数**: 当前群聊消息没有已读状态,`GET /api/messages/unread` 返回的 `totalGroupUnread` 和 `groupUnreadByGroup` 为空,预留未来扩展

3. **授权**: 所有端点都需要 JWT Bearer Token 认证

4. **错误处理**: 保持与原有端点相同的错误响应格式

## 测试验证

使用以下命令测试新端点:

```bash
# 获取私聊会话
curl -X GET "http://localhost:5185/api/messages/private/conversations/{friendId}?pageNumber=1&pageSize=20" \
  -H "Authorization: Bearer {token}"

# 发送私聊消息
curl -X POST "http://localhost:5185/api/messages/private/send" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"receiverId": "{guid}", "content": "Hello", "type": "Text"}'

# 获取群聊消息
curl -X GET "http://localhost:5185/api/messages/group/{groupId}?limit=50" \
  -H "Authorization: Bearer {token}"

# 获取统一未读数
curl -X GET "http://localhost:5185/api/messages/unread" \
  -H "Authorization: Bearer {token}"
```

## 设计优势

- ✅ **职责清晰**: MessagesController 专注消息,GroupsController 专注群组管理
- ✅ **RESTful 风格**: 路径语义化,符合 HTTP 规范
- ✅ **类型安全**: 保持独立的 DTO,避免可空字段污染
- ✅ **可扩展性**: 预留群聊未读数功能,便于未来扩展
- ✅ **一致性**: 私聊和群聊消息使用统一的路由模式
