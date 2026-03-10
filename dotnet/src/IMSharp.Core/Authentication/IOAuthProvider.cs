namespace IMSharp.Core.Authentication;

public record OAuthUserInfo(
    string Id,
    string Username,
    string Email,
    string? Name,
    string? Picture
);

public interface IOAuthProvider
{
    Task<OAuthUserInfo> ValidateTokenAsync(string accessToken, CancellationToken cancellationToken = default);
}
