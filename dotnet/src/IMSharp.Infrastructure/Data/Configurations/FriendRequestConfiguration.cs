using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class FriendRequestConfiguration : IEntityTypeConfiguration<FriendRequest>
{
    public void Configure(EntityTypeBuilder<FriendRequest> builder)
    {
        builder.ToTable("friend_requests");

        builder.HasKey(fr => fr.Id);

        builder.Property(fr => fr.Message)
            .HasMaxLength(500);

        builder.Property(fr => fr.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        // Indexes
        builder.HasIndex(fr => fr.SenderId)
            .HasDatabaseName("idx_friend_request_sender");

        builder.HasIndex(fr => new { fr.ReceiverId, fr.Status })
            .HasDatabaseName("idx_friend_request_receiver_status");

        builder.HasIndex(fr => new { fr.SenderId, fr.ReceiverId })
            .HasDatabaseName("idx_friend_request_sender_receiver");

        // Relationships
        builder.HasOne(fr => fr.Sender)
            .WithMany()
            .HasForeignKey(fr => fr.SenderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(fr => fr.Receiver)
            .WithMany()
            .HasForeignKey(fr => fr.ReceiverId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
