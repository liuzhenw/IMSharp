import type { PrivateMessage, GroupMessage, User } from './models'

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

  // 好友请求通知
  FriendRequestReceived: (senderId: string) => void

  // 好友请求被接受
  FriendRequestAccepted: (userId: string) => void

  // 群组邀请通知
  GroupInvitationReceived: (groupId: string) => void

  // 新成员加入群组
  MemberJoinedGroup: (groupId: string, user: User) => void

  // 成员离开群组
  MemberLeftGroup: (groupId: string, userId: string) => void

  // 群组信息更新
  GroupUpdated: (groupId: string) => void

  // 系统通知
  SystemNotification: (message: string) => void
}

// SignalR 方法接口
export interface SignalRMethods {
  // 发送私聊消息
  SendMessage: (receiverId: string, content: string, type: string) => Promise<void>

  // 发送群聊消息
  SendGroupMessage: (groupId: string, content: string, type: string) => Promise<void>

  // 标记消息为已读
  MarkMessageAsRead: (messageId: string) => Promise<void>

  // 发送正在输入状态
  SendTypingStatus: (receiverId: string, isTyping: boolean) => Promise<void>

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
