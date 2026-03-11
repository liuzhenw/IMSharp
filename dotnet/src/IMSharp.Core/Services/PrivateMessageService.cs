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

    public async Task<PrivateMessagePageResponse> GetConversationWithCursorAsync(
        Guid userId, Guid friendId, CursorPaginationRequest request, CancellationToken cancellationToken = default)
    {
        // 验证是好友关系
        if (!await friendRepository.AreFriendsAsync(userId, friendId, cancellationToken))
            throw new BusinessException("Can only view conversations with friends");

        // 获取消息（多取一条用于判断 hasMore）
        var messages = await messageRepository.GetConversationWithCursorAsync(
            userId, friendId, request.Before, request.After, request.Limit, cancellationToken);

        // 判断是否有更多消息
        var hasMore = messages.Count > request.Limit;
        if (hasMore)
        {
            messages.RemoveAt(messages.Count - 1);
        }

        // 映射为 DTO
        var messageDtos = _mapper.ToDtoList(messages);

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

        return new PrivateMessagePageResponse(
            messageDtos,
            hasMore,
            nextCursor,
            prevCursor
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

    public async Task<Guid> MarkAsReadAndGetSenderAsync(Guid userId, Guid messageId, CancellationToken cancellationToken = default)
    {
        var message = await messageRepository.GetByIdAsync(messageId, cancellationToken);
        if (message == null)
            throw new NotFoundException($"Message with ID {messageId} not found");

        if (message.ReceiverId != userId)
            throw new UnauthorizedException("Can only mark your own messages as read");

        await messageRepository.MarkAsReadAsync(messageId, cancellationToken);
        return message.SenderId;
    }

    public async Task MarkAllAsReadAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        // 验证是好友关系
        if (!await friendRepository.AreFriendsAsync(userId, friendId, cancellationToken))
            throw new BusinessException("Can only mark messages from friends as read");

        await messageRepository.MarkAllAsReadAsync(userId, friendId, cancellationToken);
    }
}
