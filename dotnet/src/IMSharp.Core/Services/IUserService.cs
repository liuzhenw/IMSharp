using IMSharp.Core.DTOs;

namespace IMSharp.Core.Services;

public interface IUserService
{
    Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<SearchUsersResponse> SearchAsync(string keyword, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateAvatarAsync(Guid userId, Stream avatarStream, string fileName, string contentType, CancellationToken cancellationToken = default);
}
