using IMSharp.Core.DTOs;

namespace IMSharp.Core.Services;

public interface IFriendService
{
    Task<FriendListResponse> GetFriendsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FriendRequestDto> SendFriendRequestAsync(Guid senderId, SendFriendRequestRequest request, CancellationToken cancellationToken = default);
    Task<FriendRequestListResponse> GetPendingRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FriendRequestListResponse> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FriendRequestDto> ProcessFriendRequestAsync(Guid userId, Guid requestId, ProcessFriendRequestRequest request, CancellationToken cancellationToken = default);
    Task DeleteFriendAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
}
