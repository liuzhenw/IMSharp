namespace IMSharp.Core.DTOs;

public record LoginRequest(string OAuthAccessToken);

public record LoginResponse(string AccessToken, string RefreshToken, UserDto User);

public record RefreshTokenRequest(string RefreshToken);

public record RefreshTokenResponse(string AccessToken, string RefreshToken);

public record UserDto(
    Guid Id,
    string Username,
    string DisplayName,
    string? Email,
    string? Avatar,
    bool IsOnline,
    DateTimeOffset? LastOnline
);

public record UpdateProfileRequest(string DisplayName);

public record SearchUsersResponse(List<UserDto> Users);

public record UploadResponse(string FileName, string Url);
