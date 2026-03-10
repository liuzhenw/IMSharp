using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public enum FriendRequestStatus
{
    Pending,
    Accepted,
    Rejected
}

public class FriendRequest : BaseEntity
{
    public required Guid SenderId { get; set; }
    public required Guid ReceiverId { get; set; }
    public string? Message { get; set; }
    public FriendRequestStatus Status { get; set; } = FriendRequestStatus.Pending;
    public DateTimeOffset? ProcessedAt { get; set; }

    // Navigation properties
    public User Sender { get; set; } = null!;
    public User Receiver { get; set; } = null!;
}
