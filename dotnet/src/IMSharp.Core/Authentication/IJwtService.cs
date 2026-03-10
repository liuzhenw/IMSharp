using System.Security.Claims;

namespace IMSharp.Core.Authentication;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string username, string? email);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
