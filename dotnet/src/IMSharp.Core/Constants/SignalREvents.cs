namespace IMSharp.Core.Constants;

/// <summary>
/// SignalR 事件名称常量
/// </summary>
public static class SignalREvents
{
    /// <summary>
    /// 好友请求相关事件
    /// </summary>
    public static class FriendRequest
    {
        /// <summary>
        /// 收到新的好友请求
        /// </summary>
        public const string Received = "FriendRequestReceived";

        /// <summary>
        /// 好友请求已被处理
        /// </summary>
        public const string Processed = "FriendRequestProcessed";

        /// <summary>
        /// 好友关系已建立
        /// </summary>
        public const string Added = "FriendAdded";
    }

    /// <summary>
    /// 群组加入请求相关事件
    /// </summary>
    public static class GroupJoinRequest
    {
        /// <summary>
        /// 收到新的群组加入请求
        /// </summary>
        public const string Received = "GroupJoinRequestReceived";

        /// <summary>
        /// 群组加入请求已被处理
        /// </summary>
        public const string Processed = "GroupJoinRequestProcessed";

        /// <summary>
        /// 新成员加入群组
        /// </summary>
        public const string MemberJoined = "GroupMemberJoined";
    }

    /// <summary>
    /// 消息相关事件
    /// </summary>
    public static class Message
    {
        /// <summary>
        /// 收到私聊消息
        /// </summary>
        public const string Received = "ReceiveMessage";

        /// <summary>
        /// 收到群聊消息
        /// </summary>
        public const string GroupReceived = "ReceiveGroupMessage";

        /// <summary>
        /// 消息已发送
        /// </summary>
        public const string Sent = "MessageSent";

        /// <summary>
        /// 消息已读
        /// </summary>
        public const string Read = "MessageRead";

        /// <summary>
        /// 所有消息已读
        /// </summary>
        public const string AllRead = "AllMessagesRead";
    }

    /// <summary>
    /// 用户状态相关事件
    /// </summary>
    public static class UserStatus
    {
        /// <summary>
        /// 用户上线
        /// </summary>
        public const string Online = "UserOnline";

        /// <summary>
        /// 用户离线
        /// </summary>
        public const string Offline = "UserOffline";

        /// <summary>
        /// 用户正在输入
        /// </summary>
        public const string Typing = "UserTyping";
    }
}
