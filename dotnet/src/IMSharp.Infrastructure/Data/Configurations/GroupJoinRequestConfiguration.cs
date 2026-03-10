using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class GroupJoinRequestConfiguration : IEntityTypeConfiguration<GroupJoinRequest>
{
    public void Configure(EntityTypeBuilder<GroupJoinRequest> builder)
    {
        builder.ToTable("group_join_requests");

        builder.HasKey(gjr => gjr.Id);

        builder.Property(gjr => gjr.GroupId)
            .IsRequired();

        builder.Property(gjr => gjr.UserId)
            .IsRequired();

        builder.Property(gjr => gjr.Message)
            .HasMaxLength(500);

        builder.Property(gjr => gjr.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(gjr => gjr.ProcessedAt);

        builder.Property(gjr => gjr.ProcessedBy);

        builder.Property(gjr => gjr.CreatedAt)
            .IsRequired();

        builder.Property(gjr => gjr.UpdatedAt)
            .IsRequired();

        // Relationships
        builder.HasOne(gjr => gjr.Group)
            .WithMany()
            .HasForeignKey(gjr => gjr.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gjr => gjr.User)
            .WithMany()
            .HasForeignKey(gjr => gjr.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(gjr => gjr.Processor)
            .WithMany()
            .HasForeignKey(gjr => gjr.ProcessedBy)
            .OnDelete(DeleteBehavior.SetNull);

        // Indexes
        builder.HasIndex(gjr => gjr.GroupId)
            .HasDatabaseName("idx_group_join_request_group");

        builder.HasIndex(gjr => new { gjr.GroupId, gjr.Status })
            .HasDatabaseName("idx_group_join_request_group_status");

        builder.HasIndex(gjr => new { gjr.UserId, gjr.GroupId })
            .HasDatabaseName("idx_group_join_request_user_group");

        builder.HasIndex(gjr => gjr.ProcessedBy)
            .HasDatabaseName("idx_group_join_request_processor");
    }
}
