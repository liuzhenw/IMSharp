// 用户实体
export interface User {
  id: string
  username: string
  displayName: string
  email: string
  avatar: string | null
  isOnline: boolean
  lastOnline: string
  remark?: string
}

// 消息类型
export enum MessageType {
  Text = 'Text',
  Image = 'Image',
  File = 'File',
  Audio = 'Audio',
  Video = 'Video',
}

// 消息状态
export enum MessageStatus {
  Sent = 'Sent',
  Delivered = 'Delivered',
  Read = 'Read',
}

// 私聊消息
export interface PrivateMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  type: MessageType
  status: MessageStatus
  deliveredAt: string | null
  readAt: string | null
  createdAt: string
  sender?: User
  receiver?: User
}

// 群组消息
export interface GroupMessage {
  id: string
  groupId: string
  senderId: string
  content: string
  type: MessageType
  createdAt: string
  sender?: User
}

// 群组
export interface Group {
  id: string
  name: string
  avatar: string | null
  description: string | null
  ownerId: string
  maxMembers: number
  memberCount: number
  groupNumber: number
  isPublic: boolean
  createdAt: string
  updatedAt: string | null
}

// 群组成员
export interface GroupMember {
  id: string
  groupId: string
  userId: string
  role: GroupRole
  joinedAt: string
  user?: User
}

// 群组角色
export enum GroupRole {
  Owner = 'Owner',
  Admin = 'Admin',
  Member = 'Member',
}

// 好友请求状态
export enum FriendRequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected',
}

// 好友请求
export interface FriendRequest {
  id: string
  senderId: string
  receiverId: string
  message: string | null
  status: FriendRequestStatus
  createdAt: string
  processedAt: string | null
  sender?: User
  receiver?: User
}

// 群组加入请求
export interface GroupJoinRequest {
  id: string
  groupId: string
  userId: string
  message: string | null
  status: FriendRequestStatus
  createdAt: string
  processedAt: string | null
  user?: User
  group?: Group
}

// 通知类型
export enum NotificationType {
  FriendRequest = 'FriendRequest',
  GroupInvitation = 'GroupInvitation',
  GroupJoinRequest = 'GroupJoinRequest',
  System = 'System',
}

// 通知
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  createdAt: string
  relatedId?: string
}
