using IMSharp.Domain.Entities;
using IMSharp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IMSharp.Infrastructure.Repositories;

public class FriendRepository(ApplicationDbContext context) : IFriendRepository
{
    public async Task<IEnumerable<Friendship>> GetFriendshipsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.Friendships
            .Include(f => f.Friend)
            .Where(f => f.UserId == userId)
            .ToListAsync(cancellationToken);
    }

    public async Task<Friendship?> GetFriendshipAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        return await context.Friendships
            .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == friendId, cancellationToken);
    }

    public async Task<bool> AreFriendsAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        return await context.Friendships
            .AnyAsync(f => f.UserId == userId && f.FriendId == friendId, cancellationToken);
    }

    public async Task AddFriendshipAsync(Friendship friendship, CancellationToken cancellationToken = default)
    {
        await context.Friendships.AddAsync(friendship, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteFriendshipAsync(Friendship friendship, CancellationToken cancellationToken = default)
    {
        context.Friendships.Remove(friendship);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<FriendRequest>> GetPendingRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.FriendRequests
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .Where(fr => fr.ReceiverId == userId && fr.Status == FriendRequestStatus.Pending)
            .OrderByDescending(fr => fr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<FriendRequest>> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.FriendRequests
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .Where(fr => fr.SenderId == userId)
            .OrderByDescending(fr => fr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<FriendRequest?> GetRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        return await context.FriendRequests
            .Include(fr => fr.Sender)
            .Include(fr => fr.Receiver)
            .FirstOrDefaultAsync(fr => fr.Id == requestId, cancellationToken);
    }

    public async Task<FriendRequest?> GetPendingRequestAsync(Guid senderId, Guid receiverId, CancellationToken cancellationToken = default)
    {
        return await context.FriendRequests
            .FirstOrDefaultAsync(fr => fr.SenderId == senderId && fr.ReceiverId == receiverId && fr.Status == FriendRequestStatus.Pending, cancellationToken);
    }

    public async Task AddRequestAsync(FriendRequest request, CancellationToken cancellationToken = default)
    {
        await context.FriendRequests.AddAsync(request, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateRequestAsync(FriendRequest request, CancellationToken cancellationToken = default)
    {
        context.FriendRequests.Update(request);
        await context.SaveChangesAsync(cancellationToken);
    }
}
