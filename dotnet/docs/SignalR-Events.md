# SignalR 事件常量使用指南

## 概述

所有 SignalR 事件名称已提取到 `SignalREvents` 静态类中,位于 `IMSharp.Core.Constants` 命名空间。

## 事件分类

### 1. 好友请求事件 (`SignalREvents.FriendRequest`)

| 常量 | 事件名称 | 说明 | 数据类型 |
|------|---------|------|---------|
| `Received` | `FriendRequestReceived` | 收到新的好友请求 | `FriendRequestDto` |
| `Processed` | `FriendRequestProcessed` | 好友请求已被处理 | `FriendRequestDto` |
| `Added` | `FriendAdded` | 好友关系已建立 | `FriendDto` |

### 2. 群组加入请求事件 (`SignalREvents.GroupJoinRequest`)

| 常量 | 事件名称 | 说明 | 数据类型 |
|------|---------|------|---------|
| `Received` | `GroupJoinRequestReceived` | 收到新的群组加入请求 | `GroupJoinRequestDto` |
| `Processed` | `GroupJoinRequestProcessed` | 群组加入请求已被处理 | `GroupJoinRequestDto` |
| `MemberJoined` | `GroupMemberJoined` | 新成员加入群组 | `GroupMemberDto` |

### 3. 消息事件 (`SignalREvents.Message`)

| 常量 | 事件名称 | 说明 | 数据类型 |
|------|---------|------|---------|
| `Received` | `ReceiveMessage` | 收到私聊消息 | `PrivateMessageDto` |
| `GroupReceived` | `ReceiveGroupMessage` | 收到群聊消息 | `GroupMessageDto` |
| `Sent` | `MessageSent` | 消息已发送 | `PrivateMessageDto` |
| `Read` | `MessageRead` | 消息已读 | `Guid` (messageId) |
| `AllRead` | `AllMessagesRead` | 所有消息已读 | `Guid` (userId) |

### 4. 用户状态事件 (`SignalREvents.UserStatus`)

| 常量 | 事件名称 | 说明 | 数据类型 |
|------|---------|------|---------|
| `Online` | `UserOnline` | 用户上线 | `Guid` (userId) |
| `Offline` | `UserOffline` | 用户离线 | `Guid` (userId) |
| `Typing` | `UserTyping` | 用户正在输入 | `Guid` (userId) |

## 服务端使用示例

### NotificationService

```csharp
using IMSharp.Core.Constants;

// 发送好友请求通知
await hubContext.Clients.Client(connectionId)
    .SendAsync(SignalREvents.FriendRequest.Received, requestDto);

// 发送群组加入通知
await hubContext.Clients.Group(groupId.ToString())
    .SendAsync(SignalREvents.GroupJoinRequest.MemberJoined, memberDto);
```

### ChatHub

```csharp
using IMSharp.Core.Constants;

// 用户上线通知
await Clients.Others.SendAsync(SignalREvents.UserStatus.Online, userId);

// 发送消息
await Clients.Client(connectionId)
    .SendAsync(SignalREvents.Message.Received, message);
```

## 客户端使用示例

### TypeScript/JavaScript

```typescript
import { HubConnectionBuilder } from '@microsoft/signalr';

const connection = new HubConnectionBuilder()
    .withUrl('/hubs/chat', {
        accessTokenFactory: () => getAccessToken()
    })
    .withAutomaticReconnect()
    .build();

// 好友请求事件
connection.on('FriendRequestReceived', (request) => {
    console.log('收到好友请求:', request);
});

connection.on('FriendRequestProcessed', (request) => {
    console.log('好友请求已处理:', request);
});

connection.on('FriendAdded', (friend) => {
    console.log('新增好友:', friend);
});

// 群组加入请求事件
connection.on('GroupJoinRequestReceived', (request) => {
    console.log('收到群组加入请求:', request);
});

connection.on('GroupJoinRequestProcessed', (request) => {
    console.log('群组加入请求已处理:', request);
});

connection.on('GroupMemberJoined', (member) => {
    console.log('新成员加入:', member);
});

// 消息事件
connection.on('ReceiveMessage', (message) => {
    console.log('收到私聊消息:', message);
});

connection.on('ReceiveGroupMessage', (message) => {
    console.log('收到群聊消息:', message);
});

connection.on('MessageSent', (message) => {
    console.log('消息已发送:', message);
});

connection.on('MessageRead', (messageId) => {
    console.log('消息已读:', messageId);
});

connection.on('AllMessagesRead', (userId) => {
    console.log('所有消息已读:', userId);
});

// 用户状态事件
connection.on('UserOnline', (userId) => {
    console.log('用户上线:', userId);
});

connection.on('UserOffline', (userId) => {
    console.log('用户离线:', userId);
});

connection.on('UserTyping', (userId) => {
    console.log('用户正在输入:', userId);
});

await connection.start();
```

### C# 客户端

```csharp
using Microsoft.AspNetCore.SignalR.Client;

var connection = new HubConnectionBuilder()
    .WithUrl("http://localhost:5185/hubs/chat", options =>
    {
        options.AccessTokenProvider = () => Task.FromResult(accessToken);
    })
    .WithAutomaticReconnect()
    .Build();

// 好友请求事件
connection.On<FriendRequestDto>("FriendRequestReceived", request =>
{
    Console.WriteLine($"收到好友请求: {request.Sender.DisplayName}");
});

connection.On<FriendRequestDto>("FriendRequestProcessed", request =>
{
    Console.WriteLine($"好友请求已处理: {request.Status}");
});

connection.On<FriendDto>("FriendAdded", friend =>
{
    Console.WriteLine($"新增好友: {friend.DisplayName}");
});

// 群组加入请求事件
connection.On<GroupJoinRequestDto>("GroupJoinRequestReceived", request =>
{
    Console.WriteLine($"收到群组加入请求: {request.User.DisplayName}");
});

connection.On<GroupJoinRequestDto>("GroupJoinRequestProcessed", request =>
{
    Console.WriteLine($"群组加入请求已处理: {request.Status}");
});

connection.On<GroupMemberDto>("GroupMemberJoined", member =>
{
    Console.WriteLine($"新成员加入: {member.User.DisplayName}");
});

// 消息事件
connection.On<PrivateMessageDto>("ReceiveMessage", message =>
{
    Console.WriteLine($"收到私聊消息: {message.Content}");
});

connection.On<GroupMessageDto>("ReceiveGroupMessage", message =>
{
    Console.WriteLine($"收到群聊消息: {message.Content}");
});

// 用户状态事件
connection.On<Guid>("UserOnline", userId =>
{
    Console.WriteLine($"用户上线: {userId}");
});

connection.On<Guid>("UserOffline", userId =>
{
    Console.WriteLine($"用户离线: {userId}");
});

connection.On<Guid>("UserTyping", userId =>
{
    Console.WriteLine($"用户正在输入: {userId}");
});

await connection.StartAsync();
```

## 优势

1. **类型安全**: 使用常量避免字符串拼写错误
2. **集中管理**: 所有事件名称在一个地方定义,易于维护
3. **智能提示**: IDE 可以提供自动完成和文档提示
4. **重构友好**: 修改事件名称时,编译器会检测所有引用
5. **文档清晰**: 通过 XML 注释提供事件说明

## 注意事项

1. **不要直接使用字符串**: 始终使用 `SignalREvents` 常量
2. **保持同步**: 服务端和客户端必须使用相同的事件名称
3. **版本兼容**: 修改事件名称时需要考虑客户端兼容性
