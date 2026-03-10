using IMSharp.Core.Authentication;
using IMSharp.Core.DTOs;
using IMSharp.Core.Mappers;
using IMSharp.Domain.Entities;
using IMSharp.Domain.Exceptions;
using IMSharp.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;

namespace IMSharp.Core.Services;

public class AuthService(
    IOAuthProvider oauthProvider,
    IJwtService jwtService,
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IConfiguration configuration)
    : IAuthService
{
    private readonly UserMapper _userMapper = new();
    private readonly int _refreshExpirationDays = int.Parse(configuration["Jwt:RefreshExpirationDays"] ?? "7");

    public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default)
    {
        var oauthUserInfo = await oauthProvider.ValidateTokenAsync(request.OAuthAccessToken, cancellationToken);

        var user = await userRepository.GetByOAuthAsync("Generic", oauthUserInfo.Id, cancellationToken);
        if (user is null)
        {
            if (await userRepository.GetByUsernameAsync(oauthUserInfo.Username, cancellationToken) != null)
                throw new BusinessException($"Username '{oauthUserInfo.Username}' is already taken");

            if (!string.IsNullOrEmpty(oauthUserInfo.Email) &&
                await userRepository.GetByEmailAsync(oauthUserInfo.Email, cancellationToken) != null)
            {
                throw new BusinessException($"Email '{oauthUserInfo.Email}' is already registered");
            }

            user = new User
            {
                Username = oauthUserInfo.Username,
                DisplayName = oauthUserInfo.Name ?? oauthUserInfo.Username,
                Email = oauthUserInfo.Email,
                Avatar = oauthUserInfo.Picture,
                OAuthProvider = "Generic",
                OAuthId = oauthUserInfo.Id,
                IsOnline = true,
                LastOnline = DateTimeOffset.UtcNow
            };

            await userRepository.AddAsync(user, cancellationToken);
        }
        else
        {
            user.IsOnline = true;
            user.LastOnline = DateTimeOffset.UtcNow;
            await userRepository.UpdateAsync(user, cancellationToken);
        }

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Username, user.Email);
        var refreshTokenValue = jwtService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenValue,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshExpirationDays)
        };

        await refreshTokenRepository.AddAsync(refreshToken, cancellationToken);

        return new LoginResponse(accessToken, refreshTokenValue, _userMapper.ToDto(user));
    }

    public async Task<RefreshTokenResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken cancellationToken = default)
    {
        var refreshToken = await refreshTokenRepository.GetByTokenAsync(request.RefreshToken, cancellationToken);

        if (refreshToken == null || refreshToken.IsRevoked || refreshToken.ExpiresAt < DateTimeOffset.UtcNow)
        {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        var user = refreshToken.User;

        var newAccessToken = jwtService.GenerateAccessToken(user.Id, user.Username, user.Email);
        var newRefreshTokenValue = jwtService.GenerateRefreshToken();

        refreshToken.IsRevoked = true;
        refreshToken.RevokedReason = "Replaced with new token";
        await refreshTokenRepository.UpdateAsync(refreshToken, cancellationToken);

        var newRefreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = newRefreshTokenValue,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(_refreshExpirationDays)
        };

        await refreshTokenRepository.AddAsync(newRefreshToken, cancellationToken);

        return new RefreshTokenResponse(newAccessToken, newRefreshTokenValue);
    }

    public async Task RevokeTokenAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var token = await refreshTokenRepository.GetByTokenAsync(refreshToken, cancellationToken);

        if (token != null && !token.IsRevoked)
        {
            token.IsRevoked = true;
            token.RevokedReason = "Revoked by user";
            await refreshTokenRepository.UpdateAsync(token, cancellationToken);
        }
    }
}
