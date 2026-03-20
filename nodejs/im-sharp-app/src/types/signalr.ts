import type { PrivateMessage, GroupJoinRequest, GroupMessage } from './models'

// SignalR 事件接口
export interface SignalREvents {
  // 接收私聊消息
  ReceiveMessage: (message: PrivateMessage) => void

  // 消息已发送 (回显)
  MessageSent: (message: PrivateMessage) => void

  // 接收群聊消息
  ReceiveGroupMessage: (message: GroupMessage) => void

  // 用户上线
  UserOnline: (userId: string) => void

  // 用户下线
  UserOffline: (userId: string) => void

  // 用户正在输入
  UserTyping: (userId: string, isTyping: boolean) => void

  // 消息已送达
  MessageDelivered: (messageId: string, deliveredAt: string) => void

  // 消息已读
  MessageRead: (messageId: string, readAt: string) => void

  // 会话内所有消息已读
  AllMessagesRead: (userId: string) => void

  // 好友请求通知
  FriendRequestReceived: (senderId: string) => void

  // 好友请求被处理（接受或拒绝）
  FriendRequestProcessed: (requestId: string, accepted: boolean) => void

  // 收到新的入群申请
  GroupJoinRequestReceived: (request: GroupJoinRequest) => void

  // 入群申请已被处理
  GroupJoinRequestProcessed: (request: GroupJoinRequest) => void

  // 好友被添加
  FriendAdded: (userId: string) => void

  // 好友关系被删除
  FriendDeleted: (data: { userId: string }) => void

  // 新成员加入群组
  GroupMemberJoined: (member: import('./models').GroupMember) => void

  // 成员离开群组
  MemberLeftGroup: (groupId: string, userId: string) => void

  // 群组信息更新
  GroupUpdated: (groupId: string) => void

  // 重连成功
  Reconnected: (connectionId: string | undefined) => void
}

// SignalR 方法接口
export interface SignalRMethods {
  // 发送私聊消息
  SendMessage: (receiverId: string, content: string, type: string) => Promise<void>

  // 发送群聊消息
  SendGroupMessage: (groupId: string, content: string, type: string) => Promise<void>

  // 标记消息为已读
  MarkMessageAsRead: (messageId: string) => Promise<void>

  // 标记某个会话的所有消息为已读
  MarkAllAsRead: (friendId: string) => Promise<void>

  // 发送正在输入状态
  SendTypingStatus: (receiverId: string) => Promise<void>

  // 加入群组房间
  JoinGroup: (groupId: string) => Promise<void>

  // 离开群组房间
  LeaveGroup: (groupId: string) => Promise<void>
}

// SignalR 连接状态
export enum SignalRConnectionState {
  Disconnected = 'Disconnected',
  Connecting = 'Connecting',
  Connected = 'Connected',
  Reconnecting = 'Reconnecting',
  Disconnecting = 'Disconnecting',
}
