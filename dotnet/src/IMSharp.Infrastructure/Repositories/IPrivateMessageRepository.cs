using IMSharp.Domain.Entities;

namespace IMSharp.Infrastructure.Repositories;

public interface IPrivateMessageRepository
{
    Task AddAsync(PrivateMessage message, CancellationToken cancellationToken = default);
    Task<PrivateMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<PrivateMessage>> GetConversationWithCursorAsync(
        Guid userId, Guid friendId, Guid? before, Guid? after, int limit, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountWithUserAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
    Task MarkAsDeliveredAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
}
