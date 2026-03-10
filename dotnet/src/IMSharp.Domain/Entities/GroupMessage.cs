using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public class GroupMessage : BaseEntity
{
    public required Guid GroupId { get; set; }
    public required Guid SenderId { get; set; }
    public required string Content { get; set; }
    public MessageType Type { get; set; } = MessageType.Text;
    public Guid? ReplyToId { get; set; }

    // Navigation properties
    public Group Group { get; set; } = null!;
    public User Sender { get; set; } = null!;
    public GroupMessage? ReplyTo { get; set; }
}
