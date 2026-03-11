import * as signalR from '@microsoft/signalr'
import type { SignalREvents, SignalRConnectionState } from '@/types'

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private connectionState: SignalRConnectionState = 'Disconnected' as SignalRConnectionState
  private eventHandlers: Map<keyof SignalREvents, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  // 连接到 SignalR Hub
  async connect(token: string): Promise<void> {
    if (this.connection) {
      console.warn('SignalR connection already exists')
      return
    }

    this.connectionState = 'Connecting' as SignalRConnectionState

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_HUB_URL, {
        accessTokenFactory: () => token,
        transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.ServerSentEvents,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null // 停止重连
          }
          // 指数退避: 2s, 4s, 8s, 16s, 32s
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 32000)
        },
      })
      .configureLogging(signalR.LogLevel.Information)
      .build()

    // 设置事件监听器
    this.setupEventListeners()

    // 连接状态监听
    this.connection.onclose((error) => {
      this.connectionState = 'Disconnected' as SignalRConnectionState
      console.error('SignalR connection closed:', error)
      this.reconnectAttempts = 0
    })

    this.connection.onreconnecting((error) => {
      this.connectionState = 'Reconnecting' as SignalRConnectionState
      this.reconnectAttempts++
      console.warn(`SignalR reconnecting (attempt ${this.reconnectAttempts}):`, error)
    })

    this.connection.onreconnected((connectionId) => {
      this.connectionState = 'Connected' as SignalRConnectionState
      this.reconnectAttempts = 0
      console.log('SignalR reconnected:', connectionId)
    })

    try {
      await this.connection.start()
      this.connectionState = 'Connected' as SignalRConnectionState
      console.log('SignalR connected successfully')
    } catch (error) {
      this.connectionState = 'Disconnected' as SignalRConnectionState
      console.error('SignalR connection failed:', error)
      throw error
    }
  }

  // 断开连接
  async disconnect(): Promise<void> {
    if (!this.connection) {
      return
    }

    this.connectionState = 'Disconnecting' as SignalRConnectionState

    try {
      await this.connection.stop()
      this.connection = null
      this.connectionState = 'Disconnected' as SignalRConnectionState
      this.eventHandlers.clear()
      console.log('SignalR disconnected')
    } catch (error) {
      console.error('SignalR disconnect failed:', error)
      throw error
    }
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    if (!this.connection) return

    // 接收私聊消息
    this.connection.on('ReceiveMessage', (message) => {
      this.emit('ReceiveMessage', message)
    })

    // 消息已发送 (回显)
    this.connection.on('MessageSent', (message) => {
      this.emit('MessageSent', message)
    })

    // 接收群聊消息
    this.connection.on('ReceiveGroupMessage', (message) => {
      this.emit('ReceiveGroupMessage', message)
    })

    // 用户上线
    this.connection.on('UserOnline', (userId) => {
      this.emit('UserOnline', userId)
    })

    // 用户下线
    this.connection.on('UserOffline', (userId) => {
      this.emit('UserOffline', userId)
    })

    // 用户正在输入
    this.connection.on('UserTyping', (userId, isTyping) => {
      this.emit('UserTyping', userId, isTyping)
    })

    // 消息已送达
    this.connection.on('MessageDelivered', (messageId, deliveredAt) => {
      this.emit('MessageDelivered', messageId, deliveredAt)
    })

    // 消息已读
    this.connection.on('MessageRead', (messageId, readAt) => {
      this.emit('MessageRead', messageId, readAt)
    })

    // 好友请求通知
    this.connection.on('FriendRequestReceived', (senderId) => {
      this.emit('FriendRequestReceived', senderId)
    })

    // 好友请求被接受
    this.connection.on('FriendRequestAccepted', (userId) => {
      this.emit('FriendRequestAccepted', userId)
    })

    // 群组邀请通知
    this.connection.on('GroupInvitationReceived', (groupId) => {
      this.emit('GroupInvitationReceived', groupId)
    })

    // 新成员加入群组
    this.connection.on('MemberJoinedGroup', (groupId, user) => {
      this.emit('MemberJoinedGroup', groupId, user)
    })

    // 成员离开群组
    this.connection.on('MemberLeftGroup', (groupId, userId) => {
      this.emit('MemberLeftGroup', groupId, userId)
    })

    // 群组信息更新
    this.connection.on('GroupUpdated', (groupId) => {
      this.emit('GroupUpdated', groupId)
    })

    // 系统通知
    this.connection.on('SystemNotification', (message) => {
      this.emit('SystemNotification', message)
    })
  }

  // 注册事件处理器
  on<K extends keyof SignalREvents>(event: K, handler: SignalREvents[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  // 移除事件处理器
  off<K extends keyof SignalREvents>(event: K, handler: SignalREvents[K]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 触发事件
  private emit<K extends keyof SignalREvents>(event: K, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach((handler) => handler(...args))
    }
  }

  // 发送私聊消息
  async sendMessage(receiverId: string, content: string, type: string = 'Text'): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('SendMessage', {
      target: 'Private',
      content,
      type,
      receiverId
    })
  }

  // 发送群聊消息
  async sendGroupMessage(groupId: string, content: string, type: string = 'Text'): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('SendMessage', {
      target: 'Group',
      content,
      type,
      groupId
    })
  }

  // 标记消息为已读
  async markMessageAsRead(messageId: string): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('MarkAsRead', messageId)
  }

  // 标记所有消息为已读
  async markAllAsRead(friendId: string): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('MarkAllAsRead', friendId)
  }

  // 发送正在输入状态
  async sendTypingStatus(receiverId: string): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('Typing', receiverId)
  }

  // 加入群组房间
  async joinGroup(groupId: string): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('JoinGroup', groupId)
  }

  // 离开群组房间
  async leaveGroup(groupId: string): Promise<void> {
    if (!this.connection || this.connectionState !== ('Connected' as SignalRConnectionState)) {
      throw new Error('SignalR not connected')
    }

    await this.connection.invoke('LeaveGroup', groupId)
  }

  // 获取连接状态
  getConnectionState(): SignalRConnectionState {
    return this.connectionState
  }

  // 检查是否已连接
  isConnected(): boolean {
    return this.connectionState === ('Connected' as SignalRConnectionState)
  }
}

// 导出单例
export const signalRService = new SignalRService()
