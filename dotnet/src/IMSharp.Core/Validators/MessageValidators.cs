using FluentValidation;
using IMSharp.Core.DTOs;
using IMSharp.Domain.Entities;

namespace IMSharp.Core.Validators;

public class SendMessageValidator : AbstractValidator<SendPrivateMessageRequest>
{
    public SendMessageValidator()
    {
        RuleFor(x => x.ReceiverId)
            .NotEmpty()
            .WithMessage("Receiver ID is required");

        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Message content is required")
            .MaximumLength(5000)
            .WithMessage("Message must not exceed 5000 characters");

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Invalid message type. Valid types: Text, Image, File, System");
    }
}

public class CursorPaginationRequestValidator : AbstractValidator<CursorPaginationRequest>
{
    public CursorPaginationRequestValidator()
    {
        RuleFor(x => x.Limit)
            .InclusiveBetween(1, 100)
            .WithMessage("Limit must be between 1 and 100");

        RuleFor(x => x)
            .Must(x => !(x.Before.HasValue && x.After.HasValue))
            .WithMessage("Cannot specify both 'before' and 'after' parameters");
    }
}

public class UnifiedSendMessageRequestValidator : AbstractValidator<UnifiedSendMessageRequest>
{
    public UnifiedSendMessageRequestValidator()
    {
        // 通用字段验证
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("消息内容不能为空")
            .MaximumLength(5000).WithMessage("消息内容不能超过 5000 字符");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("消息类型不能为空")
            .IsInEnum().WithMessage("无效的消息类型。有效类型: Text, Image, File, System");

        // 私聊消息验证
        When(x => x.Target == MessageTarget.Private, () =>
        {
            RuleFor(x => x.ReceiverId)
                .NotNull().WithMessage("私聊消息必须指定接收者")
                .NotEqual(Guid.Empty).WithMessage("接收者 ID 无效");

            RuleFor(x => x.GroupId)
                .Null().WithMessage("私聊消息不应包含群组 ID");

            RuleFor(x => x.ReplyToId)
                .Null().WithMessage("私聊消息不支持回复功能");
        });

        // 群聊消息验证
        When(x => x.Target == MessageTarget.Group, () =>
        {
            RuleFor(x => x.GroupId)
                .NotNull().WithMessage("群聊消息必须指定群组")
                .NotEqual(Guid.Empty).WithMessage("群组 ID 无效");

            RuleFor(x => x.ReceiverId)
                .Null().WithMessage("群聊消息不应包含接收者 ID");
        });
    }
}
