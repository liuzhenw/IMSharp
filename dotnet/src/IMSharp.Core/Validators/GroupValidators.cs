using FluentValidation;
using IMSharp.Core.DTOs;

namespace IMSharp.Core.Validators;

public class CreateGroupRequestValidator : AbstractValidator<CreateGroupRequest>
{
    public CreateGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("群组名称不能为空")
            .MaximumLength(100).WithMessage("群组名称不能超过100个字符");

        RuleFor(x => x.Avatar)
            .MaximumLength(500).WithMessage("头像URL不能超过500个字符")
            .When(x => !string.IsNullOrEmpty(x.Avatar));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("群组描述不能超过500个字符")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.MemberIds)
            .Must(ids => ids == null || ids.Count <= 100)
            .WithMessage("一次最多添加100个成员");
    }
}

public class UpdateGroupRequestValidator : AbstractValidator<UpdateGroupRequest>
{
    public UpdateGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("群组名称不能为空")
            .MaximumLength(100).WithMessage("群组名称不能超过100个字符")
            .When(x => x.Name != null);

        RuleFor(x => x.Avatar)
            .MaximumLength(500).WithMessage("头像URL不能超过500个字符")
            .When(x => !string.IsNullOrEmpty(x.Avatar));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("群组描述不能超过500个字符")
            .When(x => !string.IsNullOrEmpty(x.Description));
    }
}

public class SendGroupMessageRequestValidator : AbstractValidator<SendGroupMessageRequest>
{
    public SendGroupMessageRequestValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty().WithMessage("消息内容不能为空")
            .MaximumLength(5000).WithMessage("消息内容不能超过5000个字符");

        RuleFor(x => x.Type)
            .NotEmpty().WithMessage("消息类型不能为空")
            .IsInEnum().WithMessage("无效的消息类型");
    }
}

public class UpdateMemberRoleRequestValidator : AbstractValidator<UpdateMemberRoleRequest>
{
    public UpdateMemberRoleRequestValidator()
    {
        RuleFor(x => x.Role)
            .NotEmpty().WithMessage("角色不能为空")
            .Must(role => new[] { "Member", "Admin", "Owner" }.Contains(role))
            .WithMessage("无效的角色类型");
    }
}
