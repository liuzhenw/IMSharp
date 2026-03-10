using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public enum MessageStatus
{
    Sent,
    Delivered,
    Read
}

public class PrivateMessage : BaseEntity
{
    public required Guid SenderId { get; set; }
    public required Guid ReceiverId { get; set; }
    public required string Content { get; set; }
    public MessageType Type { get; set; } = MessageType.Text;
    public MessageStatus Status { get; set; } = MessageStatus.Sent;
    public DateTimeOffset? DeliveredAt { get; set; }
    public DateTimeOffset? ReadAt { get; set; }

    // Navigation properties
    public User Sender { get; set; } = null!;
    public User Receiver { get; set; } = null!;
}
