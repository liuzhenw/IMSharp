using IMSharp.Core.DTOs;
using IMSharp.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace IMSharp.Core.Mappers;

[Mapper]
public partial class MessageMapper
{
    private readonly UserMapper _userMapper = new();

    public PrivateMessageDto ToDto(PrivateMessage message)
    {
        return new PrivateMessageDto(
            message.Id,
            message.SenderId,
            message.ReceiverId,
            message.Content,
            message.Type.ToString(),
            message.Status.ToString(),
            message.DeliveredAt,
            message.ReadAt,
            message.CreatedAt,
            _userMapper.ToDto(message.Sender),
            _userMapper.ToDto(message.Receiver)
        );
    }

    public List<PrivateMessageDto> ToDtoList(List<PrivateMessage> messages)
    {
        return messages.Select(ToDto).ToList();
    }
}
