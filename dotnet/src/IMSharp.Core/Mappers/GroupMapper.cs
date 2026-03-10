using IMSharp.Core.DTOs;
using IMSharp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace IMSharp.Core.Mappers;

[Mapper]
public partial class GroupMapper
{
    private readonly UserMapper _userMapper = new();

    public GroupDto ToDto(Group group)
    {
        return new GroupDto(
            group.Id,
            group.Name,
            group.Avatar,
            group.Description,
            group.OwnerId,
            group.MaxMembers,
            group.Members.Count,
            group.GroupNumber,
            group.IsPublic,
            group.CreatedAt,
            group.UpdatedAt
        );
    }

    public List<GroupDto> ToDtoList(List<Group> groups)
    {
        return groups.Select(ToDto).ToList();
    }

    public GroupMemberDto ToMemberDto(GroupMember member)
    {
        return new GroupMemberDto(
            member.Id,
            member.GroupId,
            _userMapper.ToDto(member.User),
            member.Role.ToString(),
            member.Nickname,
            member.JoinedAt
        );
    }

    public List<GroupMemberDto> ToMemberDtoList(List<GroupMember> members)
    {
        return members.Select(ToMemberDto).ToList();
    }

    public GroupMessageDto ToMessageDto(GroupMessage message)
    {
        return new GroupMessageDto(
            message.Id,
            message.GroupId,
            _userMapper.ToDto(message.Sender),
            message.Content,
            message.Type.ToString(),
            message.ReplyTo != null ? ToMessageDto(message.ReplyTo) : null,
            message.CreatedAt
        );
    }

    public List<GroupMessageDto> ToMessageDtoList(List<GroupMessage> messages)
    {
        return messages.Select(ToMessageDto).ToList();
    }

    public GroupAnnouncementDto? ToAnnouncementDto(Group group)
    {
        if (string.IsNullOrEmpty(group.Announcement) || group.AnnouncementUpdater == null || group.AnnouncementUpdatedAt == null)
        {
            return null;
        }

        return new GroupAnnouncementDto(
            group.Announcement,
            group.AnnouncementUpdatedAt.Value,
            _userMapper.ToDto(group.AnnouncementUpdater)
        );
    }

    public SearchGroupResponse ToSearchResponse(Group group, bool isMember)
    {
        return new SearchGroupResponse(
            ToDto(group),
            isMember
        );
    }

    public GroupJoinRequestDto ToJoinRequestDto(GroupJoinRequest request)
    {
        return new GroupJoinRequestDto(
            request.Id,
            ToDto(request.Group),
            _userMapper.ToDto(request.User),
            request.Message,
            request.Status.ToString(),
            request.CreatedAt,
            request.ProcessedAt,
            request.Processor != null ? _userMapper.ToDto(request.Processor) : null
        );
    }

    public List<GroupJoinRequestDto> ToJoinRequestDtoList(List<GroupJoinRequest> requests)
    {
        return requests.Select(ToJoinRequestDto).ToList();
    }
}
