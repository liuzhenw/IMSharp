using IMSharp.Domain.Entities;

namespace IMSharp.Infrastructure.Repositories;

public interface IGroupRepository
{
    Task<Group?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<Group>> GetUserGroupsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<GroupMember?> GetMemberAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<GroupMember>> GetMembersAsync(Guid groupId, CancellationToken cancellationToken = default);
    Task<List<GroupMessage>> GetMessagesWithCursorAsync(Guid groupId, Guid? before, Guid? after, int limit, CancellationToken cancellationToken = default);
    Task<bool> IsMemberAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default);
    Task<Group?> GetByGroupNumberAsync(int groupNumber, CancellationToken cancellationToken = default);
    Task<bool> GroupNumberExistsAsync(int groupNumber, CancellationToken cancellationToken = default);
    Task AddAsync(Group group, CancellationToken cancellationToken = default);
    Task UpdateAsync(Group group, CancellationToken cancellationToken = default);
    Task DeleteAsync(Group group, CancellationToken cancellationToken = default);
    Task AddMemberAsync(GroupMember member, CancellationToken cancellationToken = default);
    Task UpdateMemberAsync(GroupMember member, CancellationToken cancellationToken = default);
    Task RemoveMemberAsync(GroupMember member, CancellationToken cancellationToken = default);
    Task AddMessageAsync(GroupMessage message, CancellationToken cancellationToken = default);
    Task<GroupMessage?> GetMessageByIdAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task<GroupJoinRequest?> GetJoinRequestAsync(Guid requestId, CancellationToken cancellationToken = default);
    Task<GroupJoinRequest?> GetPendingJoinRequestAsync(Guid groupId, Guid userId, CancellationToken cancellationToken = default);
    Task<IEnumerable<GroupJoinRequest>> GetPendingJoinRequestsAsync(Guid groupId, CancellationToken cancellationToken = default);
    Task<IEnumerable<GroupJoinRequest>> GetUserJoinRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddJoinRequestAsync(GroupJoinRequest request, CancellationToken cancellationToken = default);
    Task UpdateJoinRequestAsync(GroupJoinRequest request, CancellationToken cancellationToken = default);
}
