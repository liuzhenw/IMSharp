using IMSharp.Core.DTOs;
using IMSharp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace IMSharp.Core.Mappers;

[Mapper]
public partial class UserMapper
{
    public partial UserDto ToDto(User user);
    public partial List<UserDto> ToDtoList(List<User> users);
}
