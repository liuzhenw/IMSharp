using IMSharp.Core.DTOs;
using IMSharp.Core.Mappers;
using IMSharp.Domain.Exceptions;
using IMSharp.Infrastructure.Repositories;
using IMSharp.Infrastructure.Storage;

namespace IMSharp.Core.Services;

public class UserService(IUserRepository userRepository, IStorageProvider storageProvider)
    : IUserService
{
    private readonly UserMapper _userMapper = new();

    public async Task<UserDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(id, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {id} not found");
        }

        return _userMapper.ToDto(user);
    }

    public async Task<SearchUsersResponse> SearchAsync(string keyword, CancellationToken cancellationToken = default)
    {
        var users = await userRepository.SearchAsync(keyword, cancellationToken);
        return new SearchUsersResponse(_userMapper.ToDtoList(users.ToList()));
    }

    public async Task<UserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        user.DisplayName = request.DisplayName;
        await userRepository.UpdateAsync(user, cancellationToken);

        return _userMapper.ToDto(user);
    }

    public async Task<UserDto> UpdateAvatarAsync(Guid userId, Stream avatarStream, string fileName, string contentType, CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            throw new NotFoundException($"User with ID {userId} not found");
        }

        if (!string.IsNullOrEmpty(user.Avatar))
        {
            await storageProvider.DeleteAsync(user.Avatar, cancellationToken);
        }

        var savedFileName = await storageProvider.SaveAsync(avatarStream, fileName, contentType, cancellationToken);
        user.Avatar = savedFileName;
        await userRepository.UpdateAsync(user, cancellationToken);

        return _userMapper.ToDto(user);
    }
}
