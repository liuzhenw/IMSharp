using IMSharp.Domain.Entities;

namespace IMSharp.Infrastructure.Repositories;

public interface IFriendRepository
{
    Task<IEnumerable<Friendship>> GetFriendshipsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Friendship?> GetFriendshipAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
    Task<bool> AreFriendsAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
    Task AddFriendshipAsync(Friendship friendship, CancellationToken cancellationToken = default);
    Task DeleteFriendshipAsync(Friendship friendship, CancellationToken cancellationToken = default);

    Task<IEnumerable<FriendRequest>> GetPendingRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<FriendRequest>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FriendRequest?> GetRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
    Task<FriendRequest?> GetPendingRequestAsync(Guid senderId, Guid receiverId, CancellationToken cancellationToken = default);
    Task AddRequestAsync(FriendRequest request, CancellationToken cancellationToken = default);
    Task UpdateRequestAsync(FriendRequest request, CancellationToken cancellationToken = default);
}
