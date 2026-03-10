using IMSharp.Api.Hubs;
using IMSharp.Core.Constants;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using IMSharp.Domain.Entities;
using IMSharp.Infrastructure.Repositories;
using Microsoft.AspNetCore.SignalR;

namespace IMSharp.Api.Services;

public class NotificationService(
    IHubContext<ChatHub> hubContext,
    IConnectionManager connectionManager,
    IGroupRepository groupRepository,
    ILogger<NotificationService> logger) : INotificationService
{
    // 向特定用户推送通知
    private async Task NotifyUserAsync(Guid userId, string eventName, object data)
    {
        try
        {
            var connections = connectionManager.GetConnections(userId);
            foreach (var connectionId in connections) 
                await hubContext.Clients.Client(connectionId).SendAsync(eventName, data);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send notification {EventName} to user {UserId}", eventName, userId);
        }
    }

    // 好友请求通知实现
    public async Task NotifyFriendRequestReceivedAsync(Guid receiverId, FriendRequestDto request)
    {
        await NotifyUserAsync(receiverId, SignalREvents.FriendRequest.Received, request);
    }

    public async Task NotifyFriendRequestProcessedAsync(Guid senderId, FriendRequestDto request)
    {
        await NotifyUserAsync(senderId, SignalREvents.FriendRequest.Processed, request);
    }

    public async Task NotifyFriendAddedAsync(Guid userId1, Guid userId2, FriendDto friend1, FriendDto friend2)
    {
        await NotifyUserAsync(userId1, SignalREvents.FriendRequest.Added, friend1);
        await NotifyUserAsync(userId2, SignalREvents.FriendRequest.Added, friend2);
    }

    // 群组加入请求通知实现
    public async Task NotifyGroupJoinRequestReceivedAsync(Guid groupId, GroupJoinRequestDto request)
    {
        try
        {
            // 获取群主和管理员
            var members = await groupRepository.GetMembersAsync(groupId);
            var admins = members.Where(m => m.Role == GroupMemberRole.Owner || m.Role == GroupMemberRole.Admin);

            foreach (var admin in admins)
            {
                await NotifyUserAsync(admin.UserId, SignalREvents.GroupJoinRequest.Received, request);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to notify group join request received for group {GroupId}", groupId);
        }
    }

    public async Task NotifyGroupJoinRequestProcessedAsync(Guid applicantId, GroupJoinRequestDto request)
    {
        await NotifyUserAsync(applicantId, SignalREvents.GroupJoinRequest.Processed, request);
    }

    public async Task NotifyGroupMemberJoinedAsync(Guid groupId, GroupMemberDto member)
    {
        try
        {
            // 1. 将新成员的所有连接加入 SignalR Group
            var connections = connectionManager.GetConnections(member.User.Id);
            foreach (var connectionId in connections)
            {
                await hubContext.Groups.AddToGroupAsync(connectionId, groupId.ToString());
            }

            // 2. 通知群组所有成员（包括新成员）
            await hubContext.Clients.Group(groupId.ToString())
                .SendAsync(SignalREvents.GroupJoinRequest.MemberJoined, member);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to notify group member joined for group {GroupId}", groupId);
        }
    }
}
