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
    /// 获取与指定好友的私聊消息列表（游标分页）
    /// </summary>
    /// <param name="friendId">好友 ID</param>
    /// <param name="before">获取此 ID 之前的消息（向前翻页，加载历史）</param>
    /// <param name="after">获取此 ID 之后的消息（向后翻页，加载新消息）</param>
    /// <param name="limit">每页数量，默认 50，范围 1-100</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>消息列表及游标信息</returns>
    [HttpGet("private/conversations/{friendId:guid}")]
    public async Task<ActionResult<PrivateMessagePageResponse>> GetPrivateConversation(
        Guid friendId,
        [FromQuery] Guid? before = null,
        [FromQuery] Guid? after = null,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        // 验证参数互斥
        if (before.HasValue && after.HasValue)
        {
            return BadRequest("Cannot specify both 'before' and 'after' parameters");
        }

        // 验证 limit 范围
        if (limit < 1 || limit > 100)
        {
            return BadRequest("Limit must be between 1 and 100");
        }

        var userId = GetUserId();
        var request = new CursorPaginationRequest(before, after, limit);
        var response = await privateMessageService.GetConversationWithCursorAsync(userId, friendId, request, cancellationToken);
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
    [HttpPut("private/{messageId:guid}/read")]
    public async Task<IActionResult> MarkPrivateMessageAsRead(Guid messageId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        await privateMessageService.MarkAsReadAsync(userId, messageId, cancellationToken);
        return NoContent();
    }

    /// <summary>
    /// 标记与指定好友的所有消息为已读
    /// </summary>
    [HttpPut("private/conversations/{friendId:guid}/read-all")]
    public async Task<IActionResult> MarkAllPrivateMessagesAsRead(Guid friendId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        await privateMessageService.MarkAllAsReadAsync(userId, friendId, cancellationToken);
        return NoContent();
    }

    #endregion

    #region 群聊消息端点

    /// <summary>
    /// 获取指定群组的消息列表（游标分页）
    /// </summary>
    /// <param name="groupId">群组 ID</param>
    /// <param name="before">获取此 ID 之前的消息（向前翻页，加载历史）</param>
    /// <param name="after">获取此 ID 之后的消息（向后翻页，加载新消息）</param>
    /// <param name="limit">每页数量，默认 50，范围 1-100</param>
    /// <param name="cancellationToken">取消令牌</param>
    /// <returns>消息列表及游标信息</returns>
    [HttpGet("group/{groupId:guid}")]
    public async Task<ActionResult<GroupMessagePageResponse>> GetGroupMessages(
        Guid groupId,
        [FromQuery] Guid? before = null,
        [FromQuery] Guid? after = null,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        // 验证参数互斥
        if (before.HasValue && after.HasValue)
        {
            return BadRequest("Cannot specify both 'before' and 'after' parameters");
        }

        // 验证 limit 范围
        if (limit < 1 || limit > 100)
        {
            return BadRequest("Limit must be between 1 and 100");
        }

        var userId = GetUserId();
        var request = new CursorPaginationRequest(before, after, limit);
        var response = await groupService.GetMessagesWithCursorAsync(userId, groupId, request, cancellationToken);
        return Ok(response);
    }

    /// <summary>
    /// 发送群聊消息 (HTTP API)
    /// </summary>
    [HttpPost("group/{groupId:guid}/send")]
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
