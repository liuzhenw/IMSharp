using FluentAssertions;
using IMSharp.Core.DTOs;
using IMSharp.Core.Services;
using IMSharp.Domain.Entities;
using IMSharp.Infrastructure.Data;
using IMSharp.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace IMSharp.Tests;

public class CoreServiceTests
{
    private static ApplicationDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;

        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SendGroupMessage_ReturnsSentMessage()
    {
        await using var context = CreateContext(nameof(SendGroupMessage_ReturnsSentMessage));

        var owner = new User
        {
            Username = "owner",
            DisplayName = "owner",
            OAuthProvider = "Generic",
            OAuthId = "owner-oauth"
        };

        var group = new Group
        {
            Name = "group",
            OwnerId = owner.Id,
            IsPublic = true
        };

        var ownerMember = new GroupMember
        {
            GroupId = group.Id,
            UserId = owner.Id,
            Role = GroupMemberRole.Owner
        };

        context.Users.Add(owner);
        context.Groups.Add(group);
        context.GroupMembers.Add(ownerMember);
        await context.SaveChangesAsync();

        var groupRepository = new GroupRepository(context);
        var friendRepository = new FriendRepository(context);
        var groupService = new GroupService(groupRepository, friendRepository);

        var message = await groupService.SendMessageAsync(
            owner.Id,
            group.Id,
            new SendGroupMessageRequest("hello", MessageType.Text, null));

        var saved = await groupRepository.GetMessageByIdAsync(message.Id);
        saved.Should().NotBeNull();
        saved.Content.Should().Be("hello");
        message.Id.Should().Be(saved.Id);
    }

    [Fact]
    public async Task NewGroupEntities_HaveNullableUpdatedAt()
    {
        await using var context = CreateContext(nameof(NewGroupEntities_HaveNullableUpdatedAt));

        var user = new User
        {
            Username = "user",
            DisplayName = "user",
            OAuthProvider = "Generic",
            OAuthId = "user-oauth"
        };

        var group = new Group
        {
            Name = "group",
            OwnerId = user.Id,
            IsPublic = true
        };

        var member = new GroupMember
        {
            GroupId = group.Id,
            UserId = user.Id,
            Role = GroupMemberRole.Member
        };

        var message = new GroupMessage
        {
            GroupId = group.Id,
            SenderId = user.Id,
            Content = "content",
            Type = MessageType.Text
        };

        var joinRequest = new GroupJoinRequest
        {
            GroupId = group.Id,
            UserId = user.Id,
            Status = GroupJoinRequestStatus.Pending
        };

        context.Users.Add(user);
        context.Groups.Add(group);
        context.GroupMembers.Add(member);
        context.GroupMessages.Add(message);
        context.GroupJoinRequests.Add(joinRequest);
        await context.SaveChangesAsync();

        group.UpdatedAt.Should().BeNull();
        member.UpdatedAt.Should().BeNull();
        message.UpdatedAt.Should().BeNull();
        joinRequest.UpdatedAt.Should().BeNull();
    }

    [Fact]
    public async Task MarkAsRead_ReturnsSenderAndUpdatesStatus()
    {
        await using var context = CreateContext(nameof(MarkAsRead_ReturnsSenderAndUpdatesStatus));

        var sender = new User
        {
            Username = "sender",
            DisplayName = "sender",
            OAuthProvider = "Generic",
            OAuthId = "sender-oauth"
        };

        var receiver = new User
        {
            Username = "receiver",
            DisplayName = "receiver",
            OAuthProvider = "Generic",
            OAuthId = "receiver-oauth"
        };

        var message = new PrivateMessage
        {
            SenderId = sender.Id,
            ReceiverId = receiver.Id,
            Content = "hi",
            Type = MessageType.Text,
            Status = MessageStatus.Sent
        };

        context.Users.AddRange(sender, receiver);
        context.PrivateMessages.Add(message);
        await context.SaveChangesAsync();

        var messageRepository = new PrivateMessageRepository(context);
        var userRepository = new UserRepository(context);
        var friendRepository = new FriendRepository(context);
        var service = new PrivateMessageService(messageRepository, userRepository, friendRepository);

        var senderId = await service.MarkAsReadAndGetSenderAsync(receiver.Id, message.Id);
        senderId.Should().Be(sender.Id);

        var updated = await messageRepository.GetByIdAsync(message.Id);
        updated!.Status.Should().Be(MessageStatus.Read);
    }

    [Fact]
    public async Task AcceptFriendRequest_CreatesBidirectionalFriendship()
    {
        await using var context = CreateContext(nameof(AcceptFriendRequest_CreatesBidirectionalFriendship));

        var sender = new User
        {
            Username = "sender",
            DisplayName = "sender",
            OAuthProvider = "Generic",
            OAuthId = "sender-oauth"
        };

        var receiver = new User
        {
            Username = "receiver",
            DisplayName = "receiver",
            OAuthProvider = "Generic",
            OAuthId = "receiver-oauth"
        };

        var request = new FriendRequest
        {
            SenderId = sender.Id,
            ReceiverId = receiver.Id,
            Status = FriendRequestStatus.Pending
        };

        context.Users.AddRange(sender, receiver);
        context.FriendRequests.Add(request);
        await context.SaveChangesAsync();

        var friendRepository = new FriendRepository(context);
        var userRepository = new UserRepository(context);
        var service = new FriendService(friendRepository, userRepository, context);

        await service.ProcessFriendRequestAsync(receiver.Id, request.Id, new ProcessFriendRequestRequest(true));

        var friendships = await friendRepository.GetFriendshipsAsync(sender.Id);
        friendships.Should().ContainSingle(f => f.FriendId == receiver.Id);

        var reverse = await friendRepository.GetFriendshipsAsync(receiver.Id);
        reverse.Should().ContainSingle(f => f.FriendId == sender.Id);
    }
}
