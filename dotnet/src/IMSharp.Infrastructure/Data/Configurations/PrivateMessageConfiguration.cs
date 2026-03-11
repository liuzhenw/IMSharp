using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class PrivateMessageConfiguration : IEntityTypeConfiguration<PrivateMessage>
{
    public void Configure(EntityTypeBuilder<PrivateMessage> builder)
    {
        builder.ToTable("private_messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Content)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(m => m.Type)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(m => m.Status)
            .IsRequired()
            .HasConversion<string>();

        // Indexes for query optimization
        builder.HasIndex(m => new { m.ReceiverId, m.CreatedAt })
            .HasDatabaseName("idx_private_message_receiver_created");

        builder.HasIndex(m => new { m.SenderId, m.CreatedAt })
            .HasDatabaseName("idx_private_message_sender_created");

        builder.HasIndex(m => new { m.SenderId, m.ReceiverId, m.CreatedAt })
            .HasDatabaseName("idx_private_message_conversation");

        builder.HasIndex(m => new { m.ReceiverId, m.Status })
            .HasDatabaseName("idx_private_message_receiver_status");

        // Index for cursor-based pagination
        builder.HasIndex(m => new { m.SenderId, m.ReceiverId, m.Id })
            .HasDatabaseName("idx_private_message_conversation_id");

        // Relationships
        builder.HasOne(m => m.Sender)
            .WithMany()
            .HasForeignKey(m => m.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.Receiver)
            .WithMany()
            .HasForeignKey(m => m.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
