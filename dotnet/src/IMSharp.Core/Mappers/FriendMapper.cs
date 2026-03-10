using IMSharp.Core.DTOs;
using IMSharp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace IMSharp.Core.Mappers;

[Mapper]
public partial class FriendMapper
{
    public partial FriendRequestDto ToDto(FriendRequest friendRequest);
    public partial List<FriendRequestDto> ToDtoList(List<FriendRequest> friendRequests);

    public FriendDto ToFriendDto(Friendship friendship)
    {
        return new FriendDto(
            friendship.Friend.Id,
            friendship.Friend.Username,
            friendship.Friend.DisplayName,
            friendship.Friend.Email,
            friendship.Friend.Avatar,
            friendship.Friend.IsOnline,
            friendship.Friend.LastOnline,
            friendship.Remark
        );
    }

    public List<FriendDto> ToFriendDtoList(List<Friendship> friendships)
    {
        return friendships.Select(ToFriendDto).ToList();
    }
}
