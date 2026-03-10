using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public class Group : BaseEntity
{
    public required string Name { get; set; }
    public string? Avatar { get; set; }
    public string? Description { get; set; }
    public required Guid OwnerId { get; set; }
    public int MaxMembers { get; set; } = 500;
    public int GroupNumber { get; set; }
    public bool IsPublic { get; set; } = true;
    public string? Announcement { get; set; }
    public DateTimeOffset? AnnouncementUpdatedAt { get; set; }
    public Guid? AnnouncementUpdatedBy { get; set; }

    // Navigation properties
    public User Owner { get; set; } = null!;
    public User? AnnouncementUpdater { get; set; }
    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<GroupMessage> Messages { get; set; } = new List<GroupMessage>();
}
