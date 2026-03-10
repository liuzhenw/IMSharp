using System.Security.Claims;
using IMSharp.Core.Constants;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using IMSharp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace IMSharp.Api.Hubs;

[Authorize]
public class ChatHub(
    IPrivateMessageService messageService,
    IConnectionManager connectionManager,
    IUserRepository userRepository,
    IGroupService groupService,
    IGroupRepository groupRepository) : Hub
{
    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        connectionManager.AddConnection(userId, Context.ConnectionId);

        // 更新在线状态
        var user = await userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            user.IsOnline = true;
            user.LastOnline = DateTimeOffset.UtcNow;
            await userRepository.UpdateAsync(user);

            // 通知其他用户该用户上线
            await Clients.Others.SendAsync(SignalREvents.UserStatus.Online, userId);
        }

        // 自动加入用户所有群组
        var groups = await groupRepository.GetUserGroupsAsync(userId);
        foreach (var group in groups)
            await Groups.AddToGroupAsync(Context.ConnectionId, group.Id.ToString());

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        connectionManager.RemoveConnection(userId, Context.ConnectionId);

        // 只有当用户所有连接都断开时才标记为离线
        if (!connectionManager.IsOnline(userId))
        {
            var user = await userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                user.IsOnline = false;
                user.LastOnline = DateTimeOffset.UtcNow;
                await userRepository.UpdateAsync(user);

                // 通知其他用户该用户离线
                await Clients.Others.SendAsync(SignalREvents.UserStatus.Offline, userId);
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(UnifiedSendMessageRequest request)
    {
        var senderId = GetUserId();
        // 验证请求参数
        ValidateMessageRequest(request);
        // 根据 Target 路由到不同的处理逻辑
        switch (request.Target)
        {
            case MessageTarget.Private:
                await SendPrivateMessageInternal(senderId, request);
                break;
            case MessageTarget.Group:
                await SendGroupMessageInternal(senderId, request);
                break;
            default:
                throw new NotSupportedException();
        }
    }

    public async Task MarkAsRead(Guid messageId)
    {
        var userId = GetUserId();
        await messageService.MarkAsReadAsync(userId, messageId);

        // 通知发送者消息已读
        await Clients.Caller.SendAsync(SignalREvents.Message.Read, messageId);
    }

    public async Task MarkAllAsRead(Guid friendId)
    {
        var userId = GetUserId();
        await messageService.MarkAllAsReadAsync(userId, friendId);

        // 通知发送者所有消息已读
        var senderConnections = connectionManager.GetConnections(friendId);
        foreach (var connectionId in senderConnections)
        {
            await Clients.Client(connectionId).SendAsync(SignalREvents.Message.AllRead, userId);
        }
    }

    public async Task Typing(Guid receiverId)
    {
        var senderId = GetUserId();

        // 通知接收者发送者正在输入
        var receiverConnections = connectionManager.GetConnections(receiverId);
        foreach (var connectionId in receiverConnections)
        {
            await Clients.Client(connectionId).SendAsync(SignalREvents.UserStatus.Typing, senderId);
        }
    }

    public async Task JoinGroup(Guid groupId)
    {
        var userId = GetUserId();

        // 验证用户是否为群成员
        var isMember = await groupRepository.IsMemberAsync(groupId, userId);
        if (!isMember)
            throw new UnauthorizedAccessException("您不是该群组的成员");

        // 将当前连接加入 SignalR Group
        await Groups.AddToGroupAsync(Context.ConnectionId, groupId.ToString());
    }

    public async Task LeaveGroup(Guid groupId)
    {
        // 将当前连接从 SignalR Group 移除
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupId.ToString());
    }

    private static void ValidateMessageRequest(UnifiedSendMessageRequest request)
    {
        switch (request.Target)
        {
            case MessageTarget.Private:
                if (request.ReceiverId == null)
                    throw new ArgumentException("ReceiverId is required for private messages");

                if (request.ReplyToId != null)
                    throw new ArgumentException("ReplyToId is not supported for private messages");
                break;

            case MessageTarget.Group:
                if (request.GroupId == null)
                    throw new ArgumentException("GroupId is required for group messages");
                break;

            default:
                throw new ArgumentException("MessageTarget is invalid");
        }
    }

    private async Task SendPrivateMessageInternal(Guid senderId, UnifiedSendMessageRequest request)
    {
        // 转换为现有的 SendMessageRequest
        var privateRequest = new SendPrivateMessageRequest(
            request.ReceiverId!.Value,
            request.Content,
            request.Type
        );

        // 调用现有的 PrivateMessageService
        var message = await messageService.SendMessageAsync(senderId, privateRequest);

        // 推送给接收者所有连接
        var receiverConnections = connectionManager.GetConnections(request.ReceiverId.Value);
        foreach (var connectionId in receiverConnections)
            await Clients.Client(connectionId).SendAsync(SignalREvents.Message.Received, message);

        // 如果接收者在线，自动标记为 Delivered
        if (connectionManager.IsOnline(request.ReceiverId.Value))
            await messageService.MarkAsDeliveredAsync(message.Id);

        // 回显给发送者
        await Clients.Caller.SendAsync(SignalREvents.Message.Sent, message);
    }

    private async Task SendGroupMessageInternal(Guid senderId, UnifiedSendMessageRequest request)
    {
        // 转换为现有的 SendGroupMessageRequest
        var groupRequest = new SendGroupMessageRequest(
            request.Content,
            request.Type,
            request.ReplyToId
        );

        // 调用现有的 GroupService
        var message = await groupService.SendMessageAsync(senderId, request.GroupId!.Value, groupRequest);

        // 推送给群组所有在线成员（包括发送者）
        await Clients.Group(request.GroupId.Value.ToString()).SendAsync(SignalREvents.Message.GroupReceived, message);
    }

    private Guid GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim))
            throw new UnauthorizedAccessException("User ID not found in claims");

        return Guid.Parse(userIdClaim);
    }
}