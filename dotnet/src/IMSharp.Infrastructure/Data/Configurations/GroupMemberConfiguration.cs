using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class GroupMemberConfiguration : IEntityTypeConfiguration<GroupMember>
{
    public void Configure(EntityTypeBuilder<GroupMember> builder)
    {
        builder.ToTable("group_members");

        builder.HasKey(gm => gm.Id);

        builder.Property(gm => gm.GroupId)
            .IsRequired();

        builder.Property(gm => gm.UserId)
            .IsRequired();

        builder.Property(gm => gm.Role)
            .IsRequired()
            .HasConversion<string>();

        builder.Property(gm => gm.Nickname)
            .HasMaxLength(100);

        builder.Property(gm => gm.JoinedAt)
            .IsRequired();

        builder.Property(gm => gm.CreatedAt)
            .IsRequired();

        builder.Property(gm => gm.UpdatedAt)
            .IsRequired();

        // Relationships
        builder.HasOne(gm => gm.Group)
            .WithMany(g => g.Members)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gm => gm.User)
            .WithMany()
            .HasForeignKey(gm => gm.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(gm => gm.GroupId);
        builder.HasIndex(gm => gm.UserId);
        builder.HasIndex(gm => new { gm.GroupId, gm.UserId })
            .IsUnique();
    }
}
