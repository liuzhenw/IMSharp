namespace IMSharp.Core.DTOs;

public record SendFriendRequestRequest(Guid ReceiverId, string? Message);

public record ProcessFriendRequestRequest(bool Accept);

public record FriendDto(
    Guid Id,
    string Username,
    string DisplayName,
    string? Email,
    string? Avatar,
    bool IsOnline,
    DateTimeOffset? LastOnline,
    string? Remark
);

public record FriendRequestDto(
    Guid Id,
    UserDto Sender,
    UserDto Receiver,
    string? Message,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ProcessedAt
);

public record FriendListResponse(List<FriendDto> Friends);

public record FriendRequestListResponse(List<FriendRequestDto> Requests);
