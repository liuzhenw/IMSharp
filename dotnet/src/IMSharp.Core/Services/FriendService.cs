using IMSharp.Core.DTOs;
using IMSharp.Core.Mappers;
using IMSharp.Domain.Entities;
using IMSharp.Domain.Exceptions;
using IMSharp.Infrastructure.Repositories;

namespace IMSharp.Core.Services;

public class FriendService(IFriendRepository friendRepository, IUserRepository userRepository)
    : IFriendService
{
    private readonly FriendMapper _friendMapper = new();

    public async Task<FriendListResponse> GetFriendsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var friendships = await friendRepository.GetFriendshipsAsync(userId, cancellationToken);
        var friendDtos = _friendMapper.ToFriendDtoList(friendships.ToList());
        return new FriendListResponse(friendDtos);
    }

    public async Task<FriendRequestDto> SendFriendRequestAsync(Guid senderId, SendFriendRequestRequest request, CancellationToken cancellationToken = default)
    {
        // 验证接收者存在
        var receiver = await userRepository.GetByIdAsync(request.ReceiverId, cancellationToken);
        if (receiver == null)
        {
            throw new NotFoundException($"User with ID {request.ReceiverId} not found");
        }

        // 不能添加自己为好友
        if (senderId == request.ReceiverId)
        {
            throw new BusinessException("Cannot send friend request to yourself");
        }

        // 检查是否已经是好友
        if (await friendRepository.AreFriendsAsync(senderId, request.ReceiverId, cancellationToken))
        {
            throw new BusinessException("Already friends with this user");
        }

        // 检查是否已有待处理的请求
        var existingRequest = await friendRepository.GetPendingRequestAsync(senderId, request.ReceiverId, cancellationToken);
        if (existingRequest != null)
        {
            throw new BusinessException("Friend request already sent");
        }

        // 检查对方是否已向你发送请求
        var reverseRequest = await friendRepository.GetPendingRequestAsync(request.ReceiverId, senderId, cancellationToken);
        if (reverseRequest != null)
        {
            throw new BusinessException("This user has already sent you a friend request. Please accept it instead.");
        }

        // 创建好友请求
        var friendRequest = new FriendRequest
        {
            SenderId = senderId,
            ReceiverId = request.ReceiverId,
            Message = request.Message,
            Status = FriendRequestStatus.Pending
        };

        await friendRepository.AddRequestAsync(friendRequest, cancellationToken);

        // 加载关联实体并返回 DTO
        var sender = await userRepository.GetByIdAsync(senderId, cancellationToken);
        friendRequest.Sender = sender!;
        friendRequest.Receiver = receiver;

        return _friendMapper.ToDto(friendRequest);
    }

    public async Task<FriendRequestListResponse> GetPendingRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var requests = await friendRepository.GetPendingRequestsAsync(userId, cancellationToken);
        var requestDtos = _friendMapper.ToDtoList(requests.ToList());
        return new FriendRequestListResponse(requestDtos);
    }

    public async Task<FriendRequestListResponse> GetSentRequestsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var requests = await friendRepository.GetSentRequestsAsync(userId, cancellationToken);
        var requestDtos = _friendMapper.ToDtoList(requests.ToList());
        return new FriendRequestListResponse(requestDtos);
    }

    public async Task<FriendRequestDto> ProcessFriendRequestAsync(Guid userId, Guid requestId, ProcessFriendRequestRequest request, CancellationToken cancellationToken = default)
    {
        var friendRequest = await friendRepository.GetRequestAsync(requestId, cancellationToken);
        if (friendRequest == null)
            throw new NotFoundException($"Friend request with ID {requestId} not found");

        // 验证是请求的接收者
        if (friendRequest.ReceiverId != userId)
            throw new UnauthorizedException("You are not authorized to process this request");

        // 验证请求状态
        if (friendRequest.Status != FriendRequestStatus.Pending)
            throw new BusinessException("This request has already been processed");

        // 更新请求状态
        friendRequest.Status = request.Accept ? FriendRequestStatus.Accepted : FriendRequestStatus.Rejected;
        friendRequest.ProcessedAt = DateTimeOffset.UtcNow;
        await friendRepository.UpdateRequestAsync(friendRequest, cancellationToken);

        // 如果接受,创建双向好友关系
        if (request.Accept)
        {
            var friendship1 = new Friendship
            {
                UserId = friendRequest.SenderId,
                FriendId = friendRequest.ReceiverId
            };

            var friendship2 = new Friendship
            {
                UserId = friendRequest.ReceiverId,
                FriendId = friendRequest.SenderId
            };

            await friendRepository.AddFriendshipAsync(friendship1, cancellationToken);
            await friendRepository.AddFriendshipAsync(friendship2, cancellationToken);
        }

        return _friendMapper.ToDto(friendRequest);
    }

    public async Task DeleteFriendAsync(Guid userId, Guid friendId, CancellationToken cancellationToken = default)
    {
        // 验证好友关系存在
        var friendship = await friendRepository.GetFriendshipAsync(userId, friendId, cancellationToken);
        if (friendship == null)
        {
            throw new NotFoundException("Friendship not found");
        }

        // 删除双向好友关系
        var reverseFriendship = await friendRepository.GetFriendshipAsync(friendId, userId, cancellationToken);

        await friendRepository.DeleteFriendshipAsync(friendship, cancellationToken);
        if (reverseFriendship != null)
        {
            await friendRepository.DeleteFriendshipAsync(reverseFriendship, cancellationToken);
        }
    }
}
