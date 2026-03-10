using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class GroupMessageConfiguration : IEntityTypeConfiguration<GroupMessage>
{
    public void Configure(EntityTypeBuilder<GroupMessage> builder)
    {
        builder.ToTable("group_messages");

        builder.HasKey(gm => gm.Id);

        builder.Property(gm => gm.GroupId)
            .IsRequired();

        builder.Property(gm => gm.SenderId)
            .IsRequired();

        builder.Property(gm => gm.Content)
            .IsRequired()
            .HasMaxLength(5000);

        builder.Property(gm => gm.Type)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(gm => gm.CreatedAt)
            .IsRequired();

        builder.Property(gm => gm.UpdatedAt)
            .IsRequired();

        // Relationships
        builder.HasOne(gm => gm.Group)
            .WithMany(g => g.Messages)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gm => gm.Sender)
            .WithMany()
            .HasForeignKey(gm => gm.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(gm => gm.ReplyTo)
            .WithMany()
            .HasForeignKey(gm => gm.ReplyToId)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(gm => gm.GroupId);
        builder.HasIndex(gm => gm.SenderId);
        builder.HasIndex(gm => gm.CreatedAt);
        builder.HasIndex(gm => new { gm.GroupId, gm.CreatedAt });
    }
}
