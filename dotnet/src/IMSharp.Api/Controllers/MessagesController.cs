using System.Security.Claims;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMSharp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MessagesController(IPrivateMessageService messageService) : ControllerBase
{
    [HttpGet("conversation/{friendId}")]
    public async Task<ActionResult<ConversationResponse>> GetConversation(
        Guid friendId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var request = new GetConversationRequest(pageNumber, pageSize);
        var response = await messageService.GetConversationAsync(userId, friendId, request, cancellationToken);
        return Ok(response);
    }

    [HttpGet("unread")]
    public async Task<ActionResult<UnreadCountResponse>> GetUnreadCount(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await messageService.GetUnreadCountAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPut("{id}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await messageService.MarkAsReadAsync(userId, id, cancellationToken);
        return NoContent();
    }

    [HttpPut("read-all/{friendId}")]
    public async Task<IActionResult> MarkAllAsRead(Guid friendId, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await messageService.MarkAllAsReadAsync(userId, friendId, cancellationToken);
        return NoContent();
    }
}
