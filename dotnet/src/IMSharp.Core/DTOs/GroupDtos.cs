using IMSharp.Domain.Entities;

namespace IMSharp.Core.DTOs;

public record CreateGroupRequest(string Name, string? Avatar, string? Description, List<Guid>? MemberIds, bool IsPublic = true);

public record UpdateGroupRequest(string? Name, string? Avatar, string? Description, bool? IsPublic);

public record AddGroupMemberRequest(Guid UserId);

public record UpdateMemberRoleRequest(string Role);

public record SendGroupMessageRequest(string Content, MessageType Type, Guid? ReplyToId);

public record SearchGroupRequest(int GroupNumber);

public record JoinGroupRequest(int GroupNumber);

public record SendGroupJoinRequestRequest(int GroupNumber, string? Message);

public record ProcessGroupJoinRequestRequest(bool Accept);

public record SetGroupAnnouncementRequest(string Content);

public record GroupDto(
    Guid Id,
    string Name,
    string? Avatar,
    string? Description,
    Guid OwnerId,
    int MaxMembers,
    int MemberCount,
    int GroupNumber,
    bool IsPublic,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public record GroupAnnouncementDto(
    string Content,
    DateTimeOffset UpdatedAt,
    UserDto UpdatedBy
);

public record GroupMemberDto(
    Guid Id,
    Guid GroupId,
    UserDto User,
    string Role,
    string? Nickname,
    DateTimeOffset JoinedAt
);

public record GroupMessageDto(
    Guid Id,
    Guid GroupId,
    UserDto Sender,
    string Content,
    string Type,
    GroupMessageDto? ReplyTo,
    DateTimeOffset CreatedAt
);

public record GroupJoinRequestDto(
    Guid Id,
    GroupDto Group,
    UserDto User,
    string? Message,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ProcessedAt,
    UserDto? ProcessedBy
);

public record GroupListResponse(List<GroupDto> Groups);

public record GroupDetailResponse(
    GroupDto Group,
    List<GroupMemberDto> Members,
    GroupAnnouncementDto? Announcement
);

public record SearchGroupResponse(
    GroupDto Group,
    bool IsMember
);

public record GroupMessagesResponse(List<GroupMessageDto> Messages);

public record GroupJoinRequestListResponse(List<GroupJoinRequestDto> Requests);