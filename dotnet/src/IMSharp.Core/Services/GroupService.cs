using IMSharp.Core.DTOs;
using IMSharp.Core.Mappers;
using IMSharp.Domain.Entities;
using IMSharp.Domain.Exceptions;
using IMSharp.Infrastructure.Repositories;

namespace IMSharp.Core.Services;

public class GroupService(
    IGroupRepository groupRepository,
    IFriendRepository friendRepository)
    : IGroupService
{
    private readonly GroupMapper _groupMapper = new();

    public async Task<GroupDto> CreateGroupAsync(Guid userId, CreateGroupRequest request, CancellationToken cancellationToken = default)
    {
        var group = new Group
        {
            Name = request.Name,
            Avatar = request.Avatar,
            Description = request.Description,
            OwnerId = userId,
            IsPublic = request.IsPublic
        };

        await groupRepository.AddAsync(group, cancellationToken);

        // 添加创建者为群主
        var ownerMember = new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = GroupMemberRole.Owner
        };
        await groupRepository.AddMemberAsync(ownerMember, cancellationToken);

        // 添加其他成员
        if (request.MemberIds != null && request.MemberIds.Count > 0)
        {
            foreach (var memberId in request.MemberIds)
            {
                // 验证是否为好友
                var isFriend = await friendRepository.AreFriendsAsync(userId, memberId, cancellationToken);
                if (!isFriend)
                {
                    continue; // 跳过非好友
                }

                var member = new GroupMember
                {
                    GroupId = group.Id,
                    UserId = memberId,
                    Role = GroupMemberRole.Member
                };
                await groupRepository.AddMemberAsync(member, cancellationToken);
            }
        }

        // 重新加载群组以获取完整信息
        var createdGroup = await groupRepository.GetByIdAsync(group.Id, cancellationToken);
        return _groupMapper.ToDto(createdGroup!);
    }

    public async Task<GroupListResponse> GetUserGroupsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var groups = await groupRepository.GetUserGroupsAsync(userId, cancellationToken);
        var groupDtos = _groupMapper.ToDtoList(groups.ToList());
        return new GroupListResponse(groupDtos);
    }

    public async Task<GroupDetailResponse> GetGroupDetailAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 验证用户是否为群成员
        var isMember = await groupRepository.IsMemberAsync(groupId, userId, cancellationToken);
        if (!isMember)
        {
            throw new UnauthorizedException("您不是该群组的成员");
        }

        var members = await groupRepository.GetMembersAsync(groupId, cancellationToken);
        var groupDto = _groupMapper.ToDto(group);
        var memberDtos = _groupMapper.ToMemberDtoList(members.ToList());
        var announcementDto = _groupMapper.ToAnnouncementDto(group);

        return new GroupDetailResponse(groupDto, memberDtos, announcementDto);
    }

    public async Task<GroupDto> UpdateGroupAsync(Guid userId, Guid groupId, UpdateGroupRequest request, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 验证权限(只有群主和管理员可以修改)
        var member = await groupRepository.GetMemberAsync(groupId, userId, cancellationToken);
        if (member == null || (member.Role != GroupMemberRole.Owner && member.Role != GroupMemberRole.Admin))
        {
            throw new UnauthorizedException("您没有权限修改群组信息");
        }

        if (request.Name != null)
        {
            group.Name = request.Name;
        }
        if (request.Avatar != null)
        {
            group.Avatar = request.Avatar;
        }
        if (request.Description != null)
        {
            group.Description = request.Description;
        }
        if (request.IsPublic.HasValue)
        {
            group.IsPublic = request.IsPublic.Value;
        }

        await groupRepository.UpdateAsync(group, cancellationToken);

        var updatedGroup = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        return _groupMapper.ToDto(updatedGroup!);
    }

    public async Task DeleteGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 只有群主可以解散群组
        if (group.OwnerId != userId)
        {
            throw new UnauthorizedException("只有群主可以解散群组");
        }

        await groupRepository.DeleteAsync(group, cancellationToken);
    }

    public async Task AddMemberAsync(Guid userId, Guid groupId, AddGroupMemberRequest request, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 验证权限(只有群主和管理员可以添加成员)
        var member = await groupRepository.GetMemberAsync(groupId, userId, cancellationToken);
        if (member == null || (member.Role != GroupMemberRole.Owner && member.Role != GroupMemberRole.Admin))
        {
            throw new UnauthorizedException("您没有权限添加成员");
        }

        // 验证是否已经是成员
        var existingMember = await groupRepository.GetMemberAsync(groupId, request.UserId, cancellationToken);
        if (existingMember != null)
        {
            throw new BusinessException("该用户已经是群成员");
        }

        // 验证群组人数限制
        var members = await groupRepository.GetMembersAsync(groupId, cancellationToken);
        if (members.Count() >= group.MaxMembers)
        {
            throw new BusinessException("群组人数已达上限");
        }

        // 验证是否为好友
        var isFriend = await friendRepository.AreFriendsAsync(userId, request.UserId, cancellationToken);
        if (!isFriend)
        {
            throw new BusinessException("只能添加好友加入群组");
        }

        var newMember = new GroupMember
        {
            GroupId = groupId,
            UserId = request.UserId,
            Role = GroupMemberRole.Member
        };

        await groupRepository.AddMemberAsync(newMember, cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid userId, Guid groupId, Guid memberId, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 验证权限
        var operatorMember = await groupRepository.GetMemberAsync(groupId, userId, cancellationToken);
        if (operatorMember == null || (operatorMember.Role != GroupMemberRole.Owner && operatorMember.Role != GroupMemberRole.Admin))
        {
            throw new UnauthorizedException("您没有权限移除成员");
        }

        var targetMember = await groupRepository.GetMemberAsync(groupId, memberId, cancellationToken);
        if (targetMember == null)
        {
            throw new NotFoundException("该成员不存在");
        }

        // 不能移除群主
        if (targetMember.Role == GroupMemberRole.Owner)
        {
            throw new BusinessException("不能移除群主");
        }

        // 管理员不能移除其他管理员
        if (operatorMember.Role == GroupMemberRole.Admin && targetMember.Role == GroupMemberRole.Admin)
        {
            throw new UnauthorizedException("管理员不能移除其他管理员");
        }

        await groupRepository.RemoveMemberAsync(targetMember, cancellationToken);
    }

    public async Task UpdateMemberRoleAsync(Guid userId, Guid groupId, Guid memberId, UpdateMemberRoleRequest request, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 只有群主可以修改成员角色
        if (group.OwnerId != userId)
        {
            throw new UnauthorizedException("只有群主可以修改成员角色");
        }

        var targetMember = await groupRepository.GetMemberAsync(groupId, memberId, cancellationToken);
        if (targetMember == null)
        {
            throw new NotFoundException("该成员不存在");
        }

        // 不能修改群主角色
        if (targetMember.Role == GroupMemberRole.Owner)
        {
            throw new BusinessException("不能修改群主角色");
        }

        if (!Enum.TryParse<GroupMemberRole>(request.Role, out var newRole))
        {
            throw new BusinessException("无效的角色类型");
        }

        // 不能设置为群主
        if (newRole == GroupMemberRole.Owner)
        {
            throw new BusinessException("不能设置其他成员为群主");
        }

        targetMember.Role = newRole;
        await groupRepository.UpdateMemberAsync(targetMember, cancellationToken);
    }

    public async Task<GroupMessagePageResponse> GetMessagesWithCursorAsync(
        Guid userId, Guid groupId, CursorPaginationRequest request, CancellationToken cancellationToken = default)
    {
        // 验证用户是否为群成员
        var isMember = await groupRepository.IsMemberAsync(groupId, userId, cancellationToken);
        if (!isMember)
        {
            throw new UnauthorizedException("您不是该群组的成员");
        }

        // 获取消息（多取一条用于判断 hasMore）
        var messages = await groupRepository.GetMessagesWithCursorAsync(
            groupId, request.Before, request.After, request.Limit, cancellationToken);

        // 判断是否有更多消息
        var hasMore = messages.Count > request.Limit;
        if (hasMore)
        {
            messages.RemoveAt(messages.Count - 1);
        }

        // 映射为 DTO
        var messageDtos = _groupMapper.ToMessageDtoList(messages);

        // 计算游标
        Guid? nextCursor = null;
        Guid? prevCursor = null;

        if (messages.Count > 0)
        {
            if (request.After.HasValue)
            {
                // 向后加载场景：只有 prevCursor
                prevCursor = messages[^1].Id;
            }
            else
            {
                // 首次加载或向前加载场景
                if (hasMore)
                {
                    nextCursor = messages[^1].Id;
                }

                if (request.Before.HasValue)
                {
                    prevCursor = messages[0].Id;
                }
            }
        }

        return new GroupMessagePageResponse(
            messageDtos,
            hasMore,
            nextCursor,
            prevCursor
        );
    }

    public async Task<GroupMessageDto> SendMessageAsync(Guid userId, Guid groupId, SendGroupMessageRequest request, CancellationToken cancellationToken = default)
    {
        // 验证用户是否为群成员
        var isMember = await groupRepository.IsMemberAsync(groupId, userId, cancellationToken);
        if (!isMember)
        {
            throw new UnauthorizedException("您不是该群组的成员");
        }

        var message = new GroupMessage
        {
            GroupId = groupId,
            SenderId = userId,
            Content = request.Content,
            Type = request.Type,
            ReplyToId = request.ReplyToId
        };

        await groupRepository.AddMessageAsync(message, cancellationToken);

        // 重新加载消息以获取完整信息
        var sentMessage = await groupRepository.GetMessageByIdAsync(message.Id, cancellationToken);
        if (sentMessage == null)
        {
            throw new BusinessException("发送消息失败");
        }

        return _groupMapper.ToMessageDto(sentMessage);
    }

    public async Task LeaveGroupAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        var member = await groupRepository.GetMemberAsync(groupId, userId, cancellationToken);
        if (member == null)
        {
            throw new NotFoundException("您不是该群组的成员");
        }

        // 群主不能退出,只能解散群组
        if (member.Role == GroupMemberRole.Owner)
        {
            throw new BusinessException("群主不能退出群组,请先转让群主或解散群组");
        }

        await groupRepository.RemoveMemberAsync(member, cancellationToken);
    }

    public async Task<SearchGroupResponse> SearchGroupByNumberAsync(Guid userId, int groupNumber, CancellationToken cancellationToken = default)
    {
        // 验证群号格式
        if (groupNumber < 10000000 || groupNumber > 99999999)
        {
            throw new BusinessException("群号必须是8位数字");
        }

        var group = await groupRepository.GetByGroupNumberAsync(groupNumber, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupNumber} 不存在");
        }

        var isMember = await groupRepository.IsMemberAsync(group.Id, userId, cancellationToken);
        return _groupMapper.ToSearchResponse(group, isMember);
    }

    public async Task<Guid> JoinGroupByNumberAsync(Guid userId, int groupNumber, CancellationToken cancellationToken = default)
    {
        // 验证群号格式
        if (groupNumber < 10000000 || groupNumber > 99999999)
        {
            throw new BusinessException("群号必须是8位数字");
        }

        var group = await groupRepository.GetByGroupNumberAsync(groupNumber, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupNumber} 不存在");
        }

        // 检查是否已是成员
        var existingMember = await groupRepository.GetMemberAsync(group.Id, userId, cancellationToken);
        if (existingMember != null)
        {
            throw new BusinessException("您已经是该群组的成员");
        }

        // 验证群组人数限制
        var members = await groupRepository.GetMembersAsync(group.Id, cancellationToken);
        if (members.Count() >= group.MaxMembers)
        {
            throw new BusinessException("群组人数已达上限");
        }

        // 如果是私有群组,不能直接加入
        if (!group.IsPublic)
        {
            throw new BusinessException("该群组为私有群组,请发送加入申请");
        }

        // 公开群组直接加入
        var newMember = new GroupMember
        {
            GroupId = group.Id,
            UserId = userId,
            Role = GroupMemberRole.Member
        };

        await groupRepository.AddMemberAsync(newMember, cancellationToken);
        return group.Id;
    }

    public async Task SetGroupAnnouncementAsync(Guid userId, Guid groupId, string content, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 只有群主可以设置公告
        if (group.OwnerId != userId)
        {
            throw new UnauthorizedException("只有群主可以设置群公告");
        }

        // 验证内容
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new BusinessException("公告内容不能为空");
        }

        if (content.Length > 1000)
        {
            throw new BusinessException("公告内容不能超过1000个字符");
        }

        group.Announcement = content;
        group.AnnouncementUpdatedAt = DateTimeOffset.UtcNow;
        group.AnnouncementUpdatedBy = userId;

        await groupRepository.UpdateAsync(group, cancellationToken);
    }

    public async Task ClearGroupAnnouncementAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 只有群主可以清除公告
        if (group.OwnerId != userId)
        {
            throw new UnauthorizedException("只有群主可以清除群公告");
        }

        group.Announcement = null;
        group.AnnouncementUpdatedAt = null;
        group.AnnouncementUpdatedBy = null;

        await groupRepository.UpdateAsync(group, cancellationToken);
    }

    public async Task<GroupJoinRequestDto> SendGroupJoinRequestAsync(Guid userId, SendGroupJoinRequestRequest request, CancellationToken cancellationToken = default)
    {
        // 验证群号格式
        if (request.GroupNumber < 10000000 || request.GroupNumber > 99999999)
        {
            throw new BusinessException("群号必须是8位数字");
        }

        var group = await groupRepository.GetByGroupNumberAsync(request.GroupNumber, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {request.GroupNumber} 不存在");
        }

        // 检查群组是否为私有
        if (group.IsPublic)
        {
            throw new BusinessException("该群组为公开群组,可以直接加入,无需申请");
        }

        // 检查是否已是成员
        var existingMember = await groupRepository.GetMemberAsync(group.Id, userId, cancellationToken);
        if (existingMember != null)
        {
            throw new BusinessException("您已经是该群组的成员");
        }

        // 检查是否已有待处理请求
        var pendingRequest = await groupRepository.GetPendingJoinRequestAsync(group.Id, userId, cancellationToken);
        if (pendingRequest != null)
        {
            throw new BusinessException("您已经提交过加入申请,请等待审批");
        }

        // 验证群组人数限制
        var members = await groupRepository.GetMembersAsync(group.Id, cancellationToken);
        if (members.Count() >= group.MaxMembers)
        {
            throw new BusinessException("群组人数已达上限");
        }

        // 创建加入请求
        var joinRequest = new GroupJoinRequest
        {
            GroupId = group.Id,
            UserId = userId,
            Message = request.Message,
            Status = GroupJoinRequestStatus.Pending
        };

        await groupRepository.AddJoinRequestAsync(joinRequest, cancellationToken);

        // 重新加载以获取完整信息
        var createdRequest = await groupRepository.GetJoinRequestAsync(joinRequest.Id, cancellationToken);
        return _groupMapper.ToJoinRequestDto(createdRequest!);
    }

    public async Task<GroupJoinRequestListResponse> GetPendingJoinRequestsAsync(Guid userId, Guid groupId, CancellationToken cancellationToken = default)
    {
        var group = await groupRepository.GetByIdAsync(groupId, cancellationToken);
        if (group == null)
        {
            throw new NotFoundException($"群组 {groupId} 不存在");
        }

        // 验证权限(只有群主和管理员可以查看)
        var member = await groupRepository.GetMemberAsync(groupId, userId, cancellationToken);
        if (member == null || (member.Role != GroupMemberRole.Owner && member.Role != GroupMemberRole.Admin))
        {
            throw new UnauthorizedException("您没有权限查看加入申请");
        }

        var requests = await groupRepository.GetPendingJoinRequestsAsync(groupId, cancellationToken);
        var requestDtos = _groupMapper.ToJoinRequestDtoList(requests.ToList());
        return new GroupJoinRequestListResponse(requestDtos);
    }

    public async Task<GroupJoinRequestListResponse> GetMyJoinRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var requests = await groupRepository.GetUserJoinRequestsAsync(userId, cancellationToken);
        var requestDtos = _groupMapper.ToJoinRequestDtoList(requests.ToList());
        return new GroupJoinRequestListResponse(requestDtos);
    }

    public async Task<(GroupJoinRequestDto Request, GroupMemberDto? Member)> ProcessGroupJoinRequestAsync(Guid userId, Guid requestId, ProcessGroupJoinRequestRequest request, CancellationToken cancellationToken = default)
    {
        var joinRequest = await groupRepository.GetJoinRequestAsync(requestId, cancellationToken);
        if (joinRequest == null)
        {
            throw new NotFoundException("加入申请不存在");
        }

        // 验证请求状态
        if (joinRequest.Status != GroupJoinRequestStatus.Pending)
        {
            throw new BusinessException("该申请已被处理");
        }

        // 验证权限(只有群主和管理员可以处理)
        var member = await groupRepository.GetMemberAsync(joinRequest.GroupId, userId, cancellationToken);
        if (member == null || (member.Role != GroupMemberRole.Owner && member.Role != GroupMemberRole.Admin))
        {
            throw new UnauthorizedException("您没有权限处理加入申请");
        }

        // 更新请求状态
        joinRequest.Status = request.Accept ? GroupJoinRequestStatus.Accepted : GroupJoinRequestStatus.Rejected;
        joinRequest.ProcessedAt = DateTimeOffset.UtcNow;
        joinRequest.ProcessedBy = userId;

        await groupRepository.UpdateJoinRequestAsync(joinRequest, cancellationToken);

        GroupMemberDto? newMemberDto = null;

        // 如果接受,添加为群成员
        if (request.Accept)
        {
            // 再次验证是否已是成员(防止并发问题)
            var existingMember = await groupRepository.GetMemberAsync(joinRequest.GroupId, joinRequest.UserId, cancellationToken);
            if (existingMember == null)
            {
                // 再次验证人数限制
                var group = await groupRepository.GetByIdAsync(joinRequest.GroupId, cancellationToken);
                var members = await groupRepository.GetMembersAsync(joinRequest.GroupId, cancellationToken);
                if (members.Count() >= group!.MaxMembers)
                {
                    throw new BusinessException("群组人数已达上限");
                }

                var newMember = new GroupMember
                {
                    GroupId = joinRequest.GroupId,
                    UserId = joinRequest.UserId,
                    Role = GroupMemberRole.Member
                };

                await groupRepository.AddMemberAsync(newMember, cancellationToken);

                // 重新加载以获取完整信息
                var createdMember = await groupRepository.GetMemberAsync(joinRequest.GroupId, joinRequest.UserId, cancellationToken);
                newMemberDto = _groupMapper.ToMemberDto(createdMember!);
            }
        }

        // 重新加载请求以获取完整信息
        var updatedRequest = await groupRepository.GetJoinRequestAsync(requestId, cancellationToken);
        var requestDto = _groupMapper.ToJoinRequestDto(updatedRequest!);

        return (requestDto, newMemberDto);
    }
}
