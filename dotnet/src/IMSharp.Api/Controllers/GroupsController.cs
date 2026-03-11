using System.Security.Claims;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMSharp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class GroupsController(IGroupService groupService, INotificationService notificationService) : ControllerBase
{
    [HttpPost]
    public async Task<ActionResult<GroupDto>> CreateGroup([FromBody] CreateGroupRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var group = await groupService.CreateGroupAsync(userId, request, cancellationToken);
        return Ok(group);
    }

    [HttpGet]
    public async Task<ActionResult<GroupListResponse>> GetUserGroups(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await groupService.GetUserGroupsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GroupDetailResponse>> GetGroupDetail(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await groupService.GetGroupDetailAsync(userId, id, cancellationToken);
        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<GroupDto>> UpdateGroup(Guid id, [FromBody] UpdateGroupRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var group = await groupService.UpdateGroupAsync(userId, id, request, cancellationToken);
        return Ok(group);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.DeleteGroupAsync(userId, id, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddGroupMemberRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.AddMemberAsync(userId, id, request, cancellationToken);
        await notificationService.SyncUserGroupConnectionsAsync(id, request.UserId);
        return NoContent();
    }

    [HttpDelete("{id}/members/{userId}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId, CancellationToken cancellationToken)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.RemoveMemberAsync(currentUserId, id, userId, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id}/members/{userId}/role")]
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid userId, [FromBody] UpdateMemberRoleRequest request, CancellationToken cancellationToken)
    {
        var currentUserId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.UpdateMemberRoleAsync(currentUserId, id, userId, request, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/leave")]
    public async Task<IActionResult> LeaveGroup(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.LeaveGroupAsync(userId, id, cancellationToken);
        return NoContent();
    }

    [HttpGet("search/{groupNumber}")]
    public async Task<ActionResult<SearchGroupResponse>> SearchGroup(int groupNumber, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await groupService.SearchGroupByNumberAsync(userId, groupNumber, cancellationToken);
        return Ok(response);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGroup([FromBody] JoinGroupRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var groupId = await groupService.JoinGroupByNumberAsync(userId, request.GroupNumber, cancellationToken);
        await notificationService.SyncUserGroupConnectionsAsync(groupId, userId);
        return NoContent();
    }

    [HttpPut("{id}/announcement")]
    public async Task<IActionResult> SetAnnouncement(Guid id, [FromBody] SetGroupAnnouncementRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.SetGroupAnnouncementAsync(userId, id, request.Content, cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id}/announcement")]
    public async Task<IActionResult> ClearAnnouncement(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await groupService.ClearGroupAnnouncementAsync(userId, id, cancellationToken);
        return NoContent();
    }

    [HttpPost("join-request")]
    public async Task<IActionResult> SendJoinRequest([FromBody] SendGroupJoinRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requestDto = await groupService.SendGroupJoinRequestAsync(userId, request, cancellationToken);

        // 通知群主和管理员
        await notificationService.NotifyGroupJoinRequestReceivedAsync(requestDto.Group.Id, requestDto);

        return NoContent();
    }

    [HttpGet("{id}/join-requests")]
    public async Task<ActionResult<GroupJoinRequestListResponse>> GetPendingJoinRequests(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await groupService.GetPendingJoinRequestsAsync(userId, id, cancellationToken);
        return Ok(response);
    }

    [HttpGet("my-join-requests")]
    public async Task<ActionResult<GroupJoinRequestListResponse>> GetMyJoinRequests(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await groupService.GetMyJoinRequestsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("join-requests/{requestId}/process")]
    public async Task<IActionResult> ProcessJoinRequest(Guid requestId, [FromBody] ProcessGroupJoinRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var (requestDto, memberDto) = await groupService.ProcessGroupJoinRequestAsync(userId, requestId, request, cancellationToken);

        // 通知申请者请求已处理
        await notificationService.NotifyGroupJoinRequestProcessedAsync(requestDto.User.Id, requestDto);

        // 如果接受,通知群组成员并自动加入 SignalR Group
        if (request.Accept && memberDto != null)
        {
            await notificationService.NotifyGroupMemberJoinedAsync(requestDto.Group.Id, memberDto);
        }

        return NoContent();
    }
}
