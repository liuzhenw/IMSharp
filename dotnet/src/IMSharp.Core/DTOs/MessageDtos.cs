using IMSharp.Domain.Entities;

namespace IMSharp.Core.DTOs;

public enum MessageTarget
{
    Private,
    Group
}

public record UnifiedSendMessageRequest(
    MessageTarget Target,
    string Content,
    MessageType Type,
    Guid? ReceiverId = null,
    Guid? GroupId = null,
    Guid? ReplyToId = null
);

public record SendPrivateMessageRequest(Guid ReceiverId, string Content, MessageType Type);

public record CursorPaginationRequest(
    Guid? Before = null,
    Guid? After = null,
    int Limit = 50
);

public record PrivateMessageDto(
    Guid Id,
    Guid SenderId,
    Guid ReceiverId,
    string Content,
    string Type,
    string Status,
    DateTimeOffset? DeliveredAt,
    DateTimeOffset? ReadAt,
    DateTimeOffset CreatedAt,
    UserDto Sender,
    UserDto Receiver
);

public record PrivateMessagePageResponse(
    List<PrivateMessageDto> Messages,
    bool HasMore,
    Guid? NextCursor,
    Guid? PrevCursor
);

public record GroupMessagePageResponse(
    List<GroupMessageDto> Messages,
    bool HasMore,
    Guid? NextCursor,
    Guid? PrevCursor
);

public record UnreadCountResponse(
    int TotalUnread,
    Dictionary<Guid, int> UnreadByUser
);

public record UnifiedUnreadCountResponse(
    int TotalPrivateUnread,
    int TotalGroupUnread,
    Dictionary<Guid, int> PrivateUnreadByUser,
    Dictionary<Guid, int> GroupUnreadByGroup
);
