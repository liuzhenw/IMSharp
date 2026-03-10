using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public enum GroupJoinRequestStatus
{
    Pending,
    Accepted,
    Rejected
}

public class GroupJoinRequest : BaseEntity
{
    public required Guid GroupId { get; set; }
    public required Guid UserId { get; set; }
    public string? Message { get; set; }
    public GroupJoinRequestStatus Status { get; set; } = GroupJoinRequestStatus.Pending;
    public DateTimeOffset? ProcessedAt { get; set; }
    public Guid? ProcessedBy { get; set; }

    // Navigation properties
    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;
    public User? Processor { get; set; }
}
