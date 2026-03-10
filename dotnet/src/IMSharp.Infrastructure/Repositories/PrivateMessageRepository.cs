using IMSharp.Domain.Entities;
using IMSharp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IMSharp.Infrastructure.Repositories;

public class PrivateMessageRepository(ApplicationDbContext context) : IPrivateMessageRepository
{
    public async Task AddAsync(PrivateMessage message, CancellationToken cancellationToken = default)
    {
        await context.PrivateMessages.AddAsync(message, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PrivateMessage?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.PrivateMessages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
    }

    public async Task<(List<PrivateMessage> Messages, int TotalCount)> GetConversationAsync(
        Guid userId, Guid friendId, int pageNumber, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = context.PrivateMessages
            .Include(m => m.Sender)
            .Include(m => m.Receiver)
            .Where(m => (m.SenderId == userId && m.ReceiverId == friendId) ||
                        (m.SenderId == friendId && m.ReceiverId == userId))
            .OrderByDescending(m => m.CreatedAt);

        var totalCount = await query.CountAsync(cancellationToken);
        var messages = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (messages, totalCount);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.PrivateMessages
            .Where(m => m.ReceiverId == userId && m.Status != MessageStatus.Read)
            .CountAsync(cancellationToken);
    }

    public async Task<int> GetUnreadCountWithUserAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        return await context.PrivateMessages
            .Where(m => m.ReceiverId == userId && m.SenderId == friendId && m.Status != MessageStatus.Read)
            .CountAsync(cancellationToken);
    }

    public async Task MarkAsDeliveredAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        var message = await context.PrivateMessages.FindAsync([messageId], cancellationToken);
        if (message != null && message.Status == MessageStatus.Sent)
        {
            message.Status = MessageStatus.Delivered;
            message.DeliveredAt = DateTimeOffset.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAsReadAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        var message = await context.PrivateMessages.FindAsync([messageId], cancellationToken);
        if (message != null && message.Status != MessageStatus.Read)
        {
            message.Status = MessageStatus.Read;
            message.ReadAt = DateTimeOffset.UtcNow;
            await context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        var messages = await context.PrivateMessages
            .Where(m => m.ReceiverId == userId && m.SenderId == friendId && m.Status != MessageStatus.Read)
            .ToListAsync(cancellationToken);

        foreach (var message in messages)
        {
            message.Status = MessageStatus.Read;
            message.ReadAt = DateTimeOffset.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
