using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public class Friendship : BaseEntity
{
    public required Guid UserId { get; set; }
    public required Guid FriendId { get; set; }
    public string? Remark { get; set; }

    // Navigation properties
    public User User { get; set; } = null!;
    public User Friend { get; set; } = null!;
}
