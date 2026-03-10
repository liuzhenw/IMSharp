using IMSharp.Domain.Entities;

namespace IMSharp.Infrastructure.Repositories;

public interface IPrivateMessageRepository
{
    Task AddAsync(PrivateMessage message, CancellationToken cancellationToken = default);
    Task<PrivateMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(List<PrivateMessage> Messages, int TotalCount)> GetConversationAsync(
        Guid userId, Guid friendId, int pageNumber, int pageSize, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountWithUserAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
    Task MarkAsDeliveredAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
}
