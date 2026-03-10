using IMSharp.Core.DTOs;

namespace IMSharp.Core.Services;

public interface INotificationService
{
    // 好友请求通知
    Task NotifyFriendRequestReceivedAsync(Guid receiverId, FriendRequestDto request);
    Task NotifyFriendRequestProcessedAsync(Guid senderId, FriendRequestDto request);
    Task NotifyFriendAddedAsync(Guid userId1, Guid userId2, FriendDto friend1, FriendDto friend2);

    // 群组加入请求通知
    Task NotifyGroupJoinRequestReceivedAsync(Guid groupId, GroupJoinRequestDto request);
    Task NotifyGroupJoinRequestProcessedAsync(Guid applicantId, GroupJoinRequestDto request);
    Task NotifyGroupMemberJoinedAsync(Guid groupId, GroupMemberDto member);
}
