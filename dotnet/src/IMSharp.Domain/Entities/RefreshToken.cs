using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public required Guid UserId { get; set; }
    public required string Token { get; set; }
    public required DateTimeOffset ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
    public string? RevokedReason { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}
