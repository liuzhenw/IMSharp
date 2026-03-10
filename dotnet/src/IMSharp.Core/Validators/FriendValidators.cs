using FluentValidation;
using IMSharp.Core.DTOs;

namespace IMSharp.Core.Validators;

public class SendFriendRequestValidator : AbstractValidator<SendFriendRequestRequest>
{
    public SendFriendRequestValidator()
    {
        RuleFor(x => x.ReceiverId)
            .NotEmpty()
            .WithMessage("Receiver ID is required");

        RuleFor(x => x.Message)
            .MaximumLength(500)
            .WithMessage("Message must not exceed 500 characters");
    }
}
