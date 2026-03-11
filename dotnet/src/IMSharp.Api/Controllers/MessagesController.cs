using System.Security.Claims;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMSharp.Api.Controllers;

/// <summary>
/// 消息管理控制器 - 统一处理私聊和群聊消息
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController(
    IPrivateMessageService privateMessageService,
    IGroupService groupService) : ControllerBase
{
    #region 私聊消息端点

    /// <summary>
    /// 获取与指定好友的私聊消息列表
    /// </summary>
    [HttpGet("private/conversations/{friendId}")]
    public async Task<ActionResult<ConversationResponse>> GetPrivateConversation(
        Guid friendId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var request = new GetConversationRequest(pageNumber, pageSize);
        var response = await privateMessageService.GetConversationAsync(userId, friendId, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// 发送私聊消息 (HTTP API)
    /// </summary>
    [HttpPost("private/send")]
    public async Task<ActionResult<PrivateMessageDto>> SendPrivateMessage(
        [FromBody] SendPrivateMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var message = await privateMessageService.SendMessageAsync(userId, request, cancellationToken);
        return Ok(message);
    }

    /// <summary>
    /// 获取私聊未读消息统计
    /// </summary>
    [HttpGet("private/unread")]
    public async Task<ActionResult<UnreadCountResponse>> GetPrivateUnreadCount(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var response = await privateMessageService.GetUnreadCountAsync(userId, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// 标记单条私聊消息为已读
    /// </summary>
    [HttpPut("private/{messageId}/read")]
    public async Task<IActionResult> MarkPrivateMessageAsRead(Guid messageId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        await privateMessageService.MarkAsReadAsync(userId, messageId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// 标记与指定好友的所有消息为已读
    /// </summary>
    [HttpPut("private/conversations/{friendId}/read-all")]
    public async Task<IActionResult> MarkAllPrivateMessagesAsRead(Guid friendId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        await privateMessageService.MarkAllAsReadAsync(userId, friendId, cancellationToken);
        return NoContent();
    }

    #endregion

    #region 群聊消息端点

    /// <summary>
    /// 获取指定群组的消息列表
    /// </summary>
    [HttpGet("group/{groupId}")]
    public async Task<ActionResult<GroupMessagesResponse>> GetGroupMessages(
        Guid groupId,
        [FromQuery] int limit = 50,
        [FromQuery] DateTimeOffset? before = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var response = await groupService.GetMessagesAsync(userId, groupId, limit, before, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// 发送群聊消息 (HTTP API)
    /// </summary>
    [HttpPost("group/{groupId}/send")]
    public async Task<ActionResult<GroupMessageDto>> SendGroupMessage(
        Guid groupId,
        [FromBody] SendGroupMessageRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var message = await groupService.SendMessageAsync(userId, groupId, request, cancellationToken);
        return Ok(message);
    }

    #endregion

    #region 统一端点

    /// <summary>
    /// 获取所有未读消息统计 (私聊 + 群聊)
    /// </summary>
    [HttpGet("unread")]
    public async Task<ActionResult<UnifiedUnreadCountResponse>> GetUnifiedUnreadCount(CancellationToken cancellationToken)
    {
        var userId = GetUserId();

        // 并行查询私聊和群聊未读数
        var privateUnreadTask = privateMessageService.GetUnreadCountAsync(userId, cancellationToken);
        var groupUnreadTask = Task.FromResult(new Dictionary<Guid, int>()); // 群聊未读数预留

        await Task.WhenAll(privateUnreadTask, groupUnreadTask);

        var privateUnread = await privateUnreadTask;
        var groupUnread = await groupUnreadTask;

        var response = new UnifiedUnreadCountResponse(
            TotalPrivateUnread: privateUnread.TotalUnread,
            TotalGroupUnread: 0, // 预留
            PrivateUnreadByUser: privateUnread.UnreadByUser,
            GroupUnreadByGroup: groupUnread
        );

        return Ok(response);
    }

    #endregion

    #region 辅助方法

    private Guid GetUserId()
    {
        return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    #endregion
}
