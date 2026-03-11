using IMSharp.Domain.Entities;
using IMSharp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace IMSharp.Infrastructure.Repositories;

public class GroupRepository(ApplicationDbContext context) : IGroupRepository
{
    public async Task<Group?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .Include(g => g.Owner)
            .Include(g => g.AnnouncementUpdater)
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Id == id, cancellationToken);
    }

    public async Task<IEnumerable<Group>> GetUserGroupsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.GroupMembers
            .Where(gm => gm.UserId == userId)
            .Include(gm => gm.Group)
                .ThenInclude(g => g.Owner)
            .Select(gm => gm.Group)
            .OrderByDescending(g => g.UpdatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<GroupMember?> GetMemberAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.GroupMembers
            .Include(gm => gm.User)
            .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == userId, cancellationToken);
    }

    public async Task<IEnumerable<GroupMember>> GetMembersAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        return await context.GroupMembers
            .Include(gm => gm.User)
            .Where(gm => gm.GroupId == groupId)
            .OrderBy(gm => gm.JoinedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<GroupMessage>> GetMessagesWithCursorAsync(
        Guid groupId, Guid? before, Guid? after, int limit, CancellationToken cancellationToken = default)
    {
        var baseQuery = context.GroupMessages
            .Include(gm => gm.Sender)
            .Include(gm => gm.ReplyTo)
                .ThenInclude(rm => rm!.Sender)
            .Where(gm => gm.GroupId == groupId);

        List<GroupMessage> messages;

        if (after.HasValue)
        {
            // 向后加载新消息：获取 ID 大于 after 的消息
            messages = await baseQuery
                .Where(gm => gm.Id.CompareTo(after.Value) > 0)
                .OrderBy(gm => gm.Id)
                .Take(limit + 1)
                .ToListAsync(cancellationToken);

            // 反转为倒序（最新在前）
            messages.Reverse();
        }
        else if (before.HasValue)
        {
            // 向前加载历史：获取 ID 小于 before 的消息
            messages = await baseQuery
                .Where(gm => gm.Id.CompareTo(before.Value) < 0)
                .OrderByDescending(gm => gm.Id)
                .Take(limit + 1)
                .ToListAsync(cancellationToken);
        }
        else
        {
            // 首次加载：获取最新的消息
            messages = await baseQuery
                .OrderByDescending(gm => gm.Id)
                .Take(limit + 1)
                .ToListAsync(cancellationToken);
        }

        return messages;
    }

    public async Task<bool> IsMemberAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.GroupMembers
            .AnyAsync(gm => gm.GroupId == groupId && gm.UserId == userId, cancellationToken);
    }

    public async Task<Group?> GetByGroupNumberAsync(int groupNumber, CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .Include(g => g.Owner)
            .Include(g => g.AnnouncementUpdater)
            .Include(g => g.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.GroupNumber == groupNumber, cancellationToken);
    }

    public async Task<bool> GroupNumberExistsAsync(int groupNumber, CancellationToken cancellationToken = default)
    {
        return await context.Groups
            .AnyAsync(g => g.GroupNumber == groupNumber, cancellationToken);
    }

    public async Task AddAsync(Group group, CancellationToken cancellationToken = default)
    {
        await context.Groups.AddAsync(group, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Group group, CancellationToken cancellationToken = default)
    {
        context.Groups.Update(group);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Group group, CancellationToken cancellationToken = default)
    {
        context.Groups.Remove(group);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddMemberAsync(GroupMember member, CancellationToken cancellationToken = default)
    {
        await context.GroupMembers.AddAsync(member, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateMemberAsync(GroupMember member, CancellationToken cancellationToken = default)
    {
        context.GroupMembers.Update(member);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveMemberAsync(GroupMember member, CancellationToken cancellationToken = default)
    {
        context.GroupMembers.Remove(member);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task AddMessageAsync(GroupMessage message, CancellationToken cancellationToken = default)
    {
        await context.GroupMessages.AddAsync(message, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<GroupMessage?> GetMessageByIdAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        return await context.GroupMessages
            .Include(gm => gm.Sender)
            .Include(gm => gm.ReplyTo)
                .ThenInclude(rm => rm!.Sender)
            .FirstOrDefaultAsync(gm => gm.Id == messageId, cancellationToken);
    }

    public async Task<GroupJoinRequest?> GetJoinRequestAsync(Guid requestId, CancellationToken cancellationToken = default)
    {
        return await context.GroupJoinRequests
            .Include(gjr => gjr.Group)
                .ThenInclude(g => g.Owner)
            .Include(gjr => gjr.User)
            .Include(gjr => gjr.Processor)
            .FirstOrDefaultAsync(gjr => gjr.Id == requestId, cancellationToken);
    }

    public async Task<GroupJoinRequest?> GetPendingJoinRequestAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.GroupJoinRequests
            .FirstOrDefaultAsync(gjr => gjr.GroupId == groupId && gjr.UserId == userId && gjr.Status == GroupJoinRequestStatus.Pending, cancellationToken);
    }

    public async Task<IEnumerable<GroupJoinRequest>> GetPendingJoinRequestsAsync(Guid groupId, CancellationToken cancellationToken = default)
    {
        return await context.GroupJoinRequests
            .Include(gjr => gjr.Group)
                .ThenInclude(g => g.Owner)
            .Include(gjr => gjr.User)
            .Where(gjr => gjr.GroupId == groupId && gjr.Status == GroupJoinRequestStatus.Pending)
            .OrderBy(gjr => gjr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IEnumerable<GroupJoinRequest>> GetUserJoinRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await context.GroupJoinRequests
            .Include(gjr => gjr.Group)
                .ThenInclude(g => g.Owner)
            .Include(gjr => gjr.User)
            .Include(gjr => gjr.Processor)
            .Where(gjr => gjr.UserId == userId)
            .OrderByDescending(gjr => gjr.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task AddJoinRequestAsync(GroupJoinRequest request, CancellationToken cancellationToken = default)
    {
        await context.GroupJoinRequests.AddAsync(request, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateJoinRequestAsync(GroupJoinRequest request, CancellationToken cancellationToken = default)
    {
        context.GroupJoinRequests.Update(request);
        await context.SaveChangesAsync(cancellationToken);
    }
}
