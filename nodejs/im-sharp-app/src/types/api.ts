import type { User, PrivateMessage, GroupMessage, Group, GroupMember, FriendRequest, GroupJoinRequest, Notification } from './models'

// 通用分页响应
export interface PaginatedResponse<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
}

// 游标分页响应（通用）
export interface CursorPaginatedResponse<T> {
  messages: T[]
  hasMore: boolean
  nextCursor: string | null  // 用于 ?before={nextCursor} 加载更早的消息
  prevCursor: string | null  // 用于 ?after={prevCursor} 加载更新的消息
}

// 认证相关
export interface LoginRequest {
  oAuthAccessToken: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
}

export interface RevokeTokenRequest {
  refreshToken: string
}

// 用户相关
export interface SearchUsersResponse {
  users: User[]
}

export interface UpdateProfileRequest {
  displayName: string
}

// 好友相关
export interface GetFriendsResponse {
  friends: User[]
}

export interface SendFriendRequestRequest {
  receiverId: string
  message?: string
}

export interface GetFriendRequestsResponse {
  requests: FriendRequest[]
}

export interface ProcessFriendRequestRequest {
  accept: boolean
}

// 消息相关
export interface GetConversationResponse {
  messages: PrivateMessage[]
  hasMore: boolean
  nextCursor: string | null
  prevCursor: string | null
}

export interface GetUnreadMessagesResponse {
  totalUnread: number
  unreadByUser: Record<string, number>
}

export interface SendMessageRequest {
  receiverId: string
  content: string
  type: string
}

// 群组相关
export interface CreateGroupRequest {
  name: string
  avatar?: string
  description?: string
  memberIds: string[]
  isPublic: boolean
}

export interface GetGroupsResponse {
  groups: Group[]
}

export interface GetGroupMembersResponse {
  members: GroupMember[]
}

export interface GroupDetailResponse {
  group: Omit<Group, 'announcement'>
  members: GroupMember[]
  announcement: { content: string; updatedAt: string; updatedBy: import('./models').User } | null
}

export interface SendGroupMessageRequest {
  groupId: string
  content: string
  type: string
}

export interface GetGroupMessagesResponse {
  messages: GroupMessage[]
  hasMore: boolean
  nextCursor: string | null
  prevCursor: string | null
}

export interface InviteGroupMembersRequest {
  userIds: string[]
}

export interface UpdateGroupRequest {
  name?: string
  avatar?: string
  description?: string
  announcement?: string
  isPublic?: boolean
}

export interface SearchGroupResponse {
  group: Group
  isMember: boolean
}

export interface JoinGroupRequest {
  groupNumber: number
}

export interface SendGroupJoinRequestRequest {
  groupNumber: number
  message?: string
}

export interface ProcessGroupJoinRequestRequest {
  accept: boolean
}

export interface GetGroupJoinRequestsResponse {
  requests: GroupJoinRequest[]
}

// 文件上传
export interface UploadFileResponse {
  url: string
  fileName: string
}

// 通知相关
export interface GetNotificationsResponse {
  notifications: Notification[]
}

// 健康检查
export interface HealthCheckResponse {
  status: string
  timestamp: string
}

// 错误响应
export interface ErrorResponse {
  error: string
  errors?: Record<string, string[]>
}
