import * as signalR from '@microsoft/signalr'
import type { SignalREvents, SignalRConnectionState } from '@/types'

class SignalRService {
  private connection: signalR.HubConnection | null = null
  private connectionState: SignalRConnectionState = 'Disconnected' as SignalRConnectionState
  private eventHandlers: Map<keyof SignalREvents, Function[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 99
  private stateChangeCallback: ((state: SignalRConnectionState) => void) | null = null
  private currentToken: string = ''

  onStateChange(callback: (state: SignalRConnectionState) => void) {
    this.stateChangeCallback = callback
  }

  private notifyStateChange(state: SignalRConnectionState) {
    this.connectionState = state
    this.stateChangeCallback?.(state)
  }

  // 连接到 SignalR Hub
  async connect(token: string): Promise<void> {
    if (this.connection) {
      console.warn('SignalR connection already exists')
      return
    }

    this.currentToken = token
    this.notifyStateChange('Connecting' as SignalRConnectionState)

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_SIGNALR_HUB_URL, {
        accessTokenFactory: () => this.currentToken,
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
      this.notifyStateChange('Disconnected' as SignalRConnectionState)
      console.error('SignalR connection closed:', error)
      this.reconnectAttempts = 0
    })

    this.connection.onreconnecting((error) => {
      this.notifyStateChange('Reconnecting' as SignalRConnectionState)
      this.reconnectAttempts++
      console.warn(`SignalR reconnecting (attempt ${this.reconnectAttempts}):`, error)
    })

    this.connection.onreconnected((connectionId) => {
      this.notifyStateChange('Connected' as SignalRConnectionState)
      this.reconnectAttempts = 0
      console.log('SignalR reconnected:', connectionId)
      this.emit('Reconnected', connectionId)
    })

    try {
      await this.connection.start()
      this.notifyStateChange('Connected' as SignalRConnectionState)
      console.log('SignalR connected successfully')
    } catch (error) {
      this.notifyStateChange('Disconnected' as SignalRConnectionState)
      console.error('SignalR connection failed:', error)
      throw error
    }
  }

  // 断开连接
  // 更新 access token（token 刷新后调用，无需重连）
  updateAccessToken(token: string): void {
    this.currentToken = token
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return
    }

    this.notifyStateChange('Disconnecting' as SignalRConnectionState)

    try {
      await this.connection.stop()
      this.connection = null
      this.notifyStateChange('Disconnected' as SignalRConnectionState)
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

    // 好友请求被处理
    this.connection.on('FriendRequestProcessed', (requestId, accepted) => {
      this.emit('FriendRequestProcessed', requestId, accepted)
    })

    // 好友被添加
    this.connection.on('FriendAdded', (userId) => {
      this.emit('FriendAdded', userId)
    })

    // 好友关系被删除
    this.connection.on('FriendDeleted', (data) => {
      console.log('[SignalR Service] 收到 FriendDeleted 事件:', data)
      this.emit('FriendDeleted', data)
    })

    // 群组邀请通知
    this.connection.on('GroupInvitationReceived', (groupId) => {
      this.emit('GroupInvitationReceived', groupId)
    })

    // 新成员加入群组
    this.connection.on('GroupMemberJoined', (member) => {
      this.emit('GroupMemberJoined', member)
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

  // 等待连接就绪（最多等待 10 秒）
  private async waitForConnection(timeoutMs = 10000): Promise<void> {
    console.log('[SignalR] waitForConnection 开始，当前状态:', this.connectionState)

    if (this.connectionState === ('Connected' as SignalRConnectionState)) {
      console.log('[SignalR] 连接已就绪')
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs
      let waited = 0

      const check = () => {
        if (this.connectionState === ('Connected' as SignalRConnectionState)) {
          console.log('[SignalR] waitForConnection 完成，总等待时间:', waited, 'ms')
          resolve()
        } else if (Date.now() >= deadline) {
          const error = new Error(`SignalR connection timeout after ${timeoutMs}ms, current state: ${this.connectionState}`)
          console.error('[SignalR] waitForConnection 超时:', {
            waited: timeoutMs,
            connectionState: this.connectionState
          })
          reject(error)
        } else {
          waited += 200
          if (waited % 1000 === 0) {
            console.log(`[SignalR] 等待连接中... ${waited}ms, 状态: ${this.connectionState}`)
          }
          setTimeout(check, 200)
        }
      }
      check()
    })
  }

  // 加入群组房间
  async joinGroup(groupId: string): Promise<void> {
    console.log('[SignalR] joinGroup 开始:', {
      groupId,
      connectionState: this.connectionState
    })

    try {
      await this.waitForConnection()
      console.log('[SignalR] 连接就绪，调用 JoinGroup')
      await this.connection!.invoke('JoinGroup', groupId)
      console.log('[SignalR] JoinGroup 调用成功')
    } catch (error) {
      console.error('[SignalR] joinGroup 失败:', {
        groupId,
        error,
        connectionState: this.connectionState
      })
      throw error
    }
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
