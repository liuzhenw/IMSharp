using System.Text.Json;
using IMSharp.Domain.Exceptions;
using Microsoft.Extensions.Configuration;

namespace IMSharp.Core.Authentication;

public class GenericOAuthProvider(HttpClient httpClient, IConfiguration configuration) : IOAuthProvider
{
    private readonly string _userInfoEndpoint = configuration["OAuth:UserInfoEndpoint"]
                                                ?? throw new InvalidOperationException("OAuth UserInfoEndpoint is not configured");

    public async Task<OAuthUserInfo> ValidateTokenAsync(string accessToken, CancellationToken cancellationToken = default)
    {
        try
        {
            httpClient.DefaultRequestHeaders.Clear();
            httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {accessToken}");

            var response = await httpClient.GetAsync(_userInfoEndpoint, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new UnauthorizedException("Invalid OAuth access token");
            }

            var content = await response.Content.ReadAsStringAsync(cancellationToken);
            var jsonDoc = JsonDocument.Parse(content);
            var root = jsonDoc.RootElement;

            var id = GetProperty(root,  "sub") ?? throw new BusinessException("OAuth user ID not found");
            var username = GetProperty(root, "name") ?? throw new BusinessException("OAuth username not found");
            var email = GetProperty(root, "email") ?? string.Empty;
            var name = GetProperty(root, "nick");
            var picture = GetProperty(root, "avatar");
            return new OAuthUserInfo(id, username, email, name, picture);
        }
        catch (HttpRequestException ex)
        {
            throw new BusinessException("Failed to validate OAuth token", ex);
        }
    }

    private static string? GetProperty(JsonElement element, params string[] propertyNames)
    {
        foreach (var name in propertyNames)
        {
            if (element.TryGetProperty(name, out var property))
            {
                return property.GetString();
            }
        }
        return null;
    }
}
