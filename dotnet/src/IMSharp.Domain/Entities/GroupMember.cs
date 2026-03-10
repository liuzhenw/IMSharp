using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public enum GroupMemberRole
{
    Member,
    Admin,
    Owner
}

public class GroupMember : BaseEntity
{
    public required Guid GroupId { get; set; }
    public required Guid UserId { get; set; }
    public GroupMemberRole Role { get; set; } = GroupMemberRole.Member;
    public string? Nickname { get; set; }
    public DateTimeOffset JoinedAt { get; set; } = DateTimeOffset.UtcNow;

    // Navigation properties
    public Group Group { get; set; } = null!;
    public User User { get; set; } = null!;
}
