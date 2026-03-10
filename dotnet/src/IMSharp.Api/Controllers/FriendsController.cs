using System.Security.Claims;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IMSharp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FriendsController(IFriendService friendService, INotificationService notificationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<FriendListResponse>> GetFriends(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await friendService.GetFriendsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPost("requests")]
    public async Task<IActionResult> SendFriendRequest([FromBody] SendFriendRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requestDto = await friendService.SendFriendRequestAsync(userId, request, cancellationToken);

        // 通知接收者
        await notificationService.NotifyFriendRequestReceivedAsync(request.ReceiverId, requestDto);

        return NoContent();
    }

    [HttpGet("requests")]
    public async Task<ActionResult<FriendRequestListResponse>> GetPendingRequests(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await friendService.GetPendingRequestsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpGet("requests/sent")]
    public async Task<ActionResult<FriendRequestListResponse>> GetSentRequests(CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await friendService.GetSentRequestsAsync(userId, cancellationToken);
        return Ok(response);
    }

    [HttpPut("requests/{id}")]
    public async Task<IActionResult> ProcessFriendRequest(Guid id, [FromBody] ProcessFriendRequestRequest request, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var requestDto = await friendService.ProcessFriendRequestAsync(userId, id, request, cancellationToken);

        // 通知发送者请求已处理
        await notificationService.NotifyFriendRequestProcessedAsync(requestDto.Sender.Id, requestDto);

        // 如果接受,通知双方好友关系已建立
        if (request.Accept)
        {
            var friends = await friendService.GetFriendsAsync(userId, cancellationToken);
            var friend1 = friends.Friends.First(f => f.Id == requestDto.Sender.Id);

            var senderFriends = await friendService.GetFriendsAsync(requestDto.Sender.Id, cancellationToken);
            var friend2 = senderFriends.Friends.First(f => f.Id == userId);

            await notificationService.NotifyFriendAddedAsync(userId, requestDto.Sender.Id, friend1, friend2);
        }

        return NoContent();
    }

    [HttpDelete("{friendId}")]
    public async Task<IActionResult> DeleteFriend(Guid friendId, CancellationToken cancellationToken)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await friendService.DeleteFriendAsync(userId, friendId, cancellationToken);
        return NoContent();
    }
}
