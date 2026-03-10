using IMSharp.Domain.Common;

namespace IMSharp.Domain.Entities;

public class User : BaseEntity
{
    public required string Username { get; set; }
    public required string DisplayName { get; set; }
    public string? Email { get; set; }
    public string? Avatar { get; set; }
    public bool IsOnline { get; set; }
    public DateTimeOffset? LastOnline { get; set; }

    // OAuth fields
    public required string OAuthProvider { get; set; }
    public required string OAuthId { get; set; }

    // Navigation properties
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
