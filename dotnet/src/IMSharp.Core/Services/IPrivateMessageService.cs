using IMSharp.Core.DTOs;

namespace IMSharp.Core.Services;

public interface IPrivateMessageService
{
    Task<PrivateMessageDto> SendMessageAsync(Guid senderId, SendPrivateMessageRequest request, CancellationToken cancellationToken = default);
    Task<ConversationResponse> GetConversationAsync(Guid userId, Guid friendId, GetConversationRequest request, CancellationToken cancellationToken = default);
    Task<UnreadCountResponse> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MarkAsDeliveredAsync(Guid messageId, CancellationToken cancellationToken = default);
    Task MarkAsReadAsync(Guid userId, Guid messageId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default);
}
