using IMSharp.Core.DTOs;
using IMSharp.Core.Mappers;
using IMSharp.Domain.Entities;
using IMSharp.Domain.Exceptions;
using IMSharp.Infrastructure.Repositories;

namespace IMSharp.Core.Services;

public class PrivateMessageService(
    IPrivateMessageRepository messageRepository,
    IUserRepository userRepository,
    IFriendRepository friendRepository)
    : IPrivateMessageService
{
    private readonly MessageMapper _mapper = new();

    public async Task<PrivateMessageDto> SendMessageAsync(
        Guid senderId, SendPrivateMessageRequest request, CancellationToken cancellationToken = default)
    {
        // 验证接收者存在
        var receiver = await userRepository.GetByIdAsync(request.ReceiverId, cancellationToken);
        if (receiver == null)
            throw new NotFoundException($"User with ID {request.ReceiverId} not found");

        // 验证是好友关系
        if (!await friendRepository.AreFriendsAsync(senderId, request.ReceiverId, cancellationToken))
            throw new BusinessException("Can only send messages to friends");

        // 创建消息
        var message = new PrivateMessage
        {
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            Content = request.Content,
            Type = request.Type,
            Status = MessageStatus.Sent
        };

        await messageRepository.AddAsync(message, cancellationToken);

        // 重新获取消息以包含导航属性
        var savedMessage = await messageRepository.GetByIdAsync(message.Id, cancellationToken);
        return _mapper.ToDto(savedMessage!);
    }

    public async Task<ConversationResponse> GetConversationAsync(
        Guid userId, Guid friendId, GetConversationRequest request, CancellationToken cancellationToken = default)
    {
        // 验证是好友关系
        if (!await friendRepository.AreFriendsAsync(userId, friendId, cancellationToken))
            throw new BusinessException("Can only view conversations with friends");

        var (messages, totalCount) = await messageRepository.GetConversationAsync(
            userId, friendId, request.PageNumber, request.PageSize, cancellationToken);

        var messageDtos = _mapper.ToDtoList(messages);
        var totalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize);

        return new ConversationResponse(
            messageDtos,
            totalCount,
            request.PageNumber,
            request.PageSize,
            totalPages
        );
    }

    public async Task<UnreadCountResponse> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var totalUnread = await messageRepository.GetUnreadCountAsync(userId, cancellationToken);

        // 获取所有好友
        var friendships = await friendRepository.GetFriendshipsAsync(userId, cancellationToken);
        var unreadByUser = new Dictionary<Guid, int>();

        foreach (var friendship in friendships)
        {
            var count = await messageRepository.GetUnreadCountWithUserAsync(userId, friendship.FriendId, cancellationToken);
            if (count > 0)
                unreadByUser[friendship.FriendId] = count;
        }

        return new UnreadCountResponse(totalUnread, unreadByUser);
    }

    public async Task MarkAsDeliveredAsync(Guid messageId, CancellationToken cancellationToken = default)
    {
        await messageRepository.MarkAsDeliveredAsync(messageId, cancellationToken);
    }

    public async Task MarkAsReadAsync(Guid userId, Guid messageId, CancellationToken cancellationToken = default)
    {
        var message = await messageRepository.GetByIdAsync(messageId, cancellationToken);
        if (message == null)
            throw new NotFoundException($"Message with ID {messageId} not found");

        // 验证是消息接收者
        if (message.ReceiverId != userId)
            throw new UnauthorizedException("Can only mark your own messages as read");

        await messageRepository.MarkAsReadAsync(messageId, cancellationToken);
    }

    public async Task MarkAllAsReadAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        // 验证是好友关系
        if (!await friendRepository.AreFriendsAsync(userId, friendId, cancellationToken))
            throw new BusinessException("Can only mark messages from friends as read");

        await messageRepository.MarkAllAsReadAsync(userId, friendId, cancellationToken);
    }
}