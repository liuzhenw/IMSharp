using IMSharp.Core.DTOs;

namespace IMSharp.Core.Services;

public interface IGroupService
{
    Task<GroupDto> CreateGroupAsync(Guid userId, CreateGroupRequest request, CancellationToken cancellationToken = default);
    Task<GroupListResponse> GetUserGroupsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<GroupDetailResponse> GetGroupDetailAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default);
    Task<GroupDto> UpdateGroupAsync(Guid userId, Guid groupId, UpdateGroupRequest request, CancellationToken cancellationToken = default);
    Task DeleteGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default);
    Task AddMemberAsync(Guid userId, Guid groupId, AddGroupMemberRequest request, CancellationToken cancellationToken = default);
    Task RemoveMemberAsync(Guid userId, Guid groupId, Guid memberId, CancellationToken cancellationToken = default);
    Task UpdateMemberRoleAsync(Guid userId, Guid groupId, Guid memberId, UpdateMemberRoleRequest request, CancellationToken cancellationToken = default);
    Task<GroupMessagePageResponse> GetMessagesWithCursorAsync(Guid userId, Guid groupId, CursorPaginationRequest request, CancellationToken cancellationToken = default);
    Task<GroupMessageDto> SendMessageAsync(Guid userId, Guid groupId, SendGroupMessageRequest request, CancellationToken cancellationToken = default);
    Task LeaveGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default);
    Task<SearchGroupResponse> SearchGroupByNumberAsync(Guid userId, int groupNumber, CancellationToken cancellationToken = default);
    Task<Guid> JoinGroupByNumberAsync(Guid userId, int groupNumber, CancellationToken cancellationToken = default);
    Task SetGroupAnnouncementAsync(Guid userId, Guid groupId, string content, CancellationToken cancellationToken = default);
    Task ClearGroupAnnouncementAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default);
    Task<GroupJoinRequestDto> SendGroupJoinRequestAsync(Guid userId, SendGroupJoinRequestRequest request, CancellationToken cancellationToken = default);
    Task<GroupJoinRequestListResponse> GetPendingJoinRequestsAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default);
    Task<GroupJoinRequestListResponse> GetMyJoinRequestsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<(GroupJoinRequestDto Request, GroupMemberDto? Member)> ProcessGroupJoinRequestAsync(Guid userId, Guid requestId, ProcessGroupJoinRequestRequest request, CancellationToken cancellationToken = default);
}
