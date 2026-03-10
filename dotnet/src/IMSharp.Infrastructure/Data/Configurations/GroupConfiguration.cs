using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.ToTable("groups");

        builder.HasKey(g => g.Id);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(g => g.Avatar)
            .HasMaxLength(500);

        builder.Property(g => g.Description)
            .HasMaxLength(500);

        builder.Property(g => g.OwnerId)
            .IsRequired();

        builder.Property(g => g.MaxMembers)
            .IsRequired()
            .HasDefaultValue(500);

        builder.Property(g => g.GroupNumber)
            .IsRequired()
            .HasDefaultValueSql("nextval('group_number_seq')");

        builder.Property(g => g.Announcement)
            .HasMaxLength(1000);

        builder.Property(g => g.AnnouncementUpdatedAt);

        builder.Property(g => g.AnnouncementUpdatedBy);

        builder.Property(g => g.IsPublic)
            .IsRequired()
            .HasDefaultValue(true);

        builder.Property(g => g.CreatedAt)
            .IsRequired();

        builder.Property(g => g.UpdatedAt)
            .IsRequired();

        // Relationships
        builder.HasOne(g => g.Owner)
            .WithMany()
            .HasForeignKey(g => g.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.AnnouncementUpdater)
            .WithMany()
            .HasForeignKey(g => g.AnnouncementUpdatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(g => g.Members)
            .WithOne(gm => gm.Group)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(g => g.Messages)
            .WithOne(gm => gm.Group)
            .HasForeignKey(gm => gm.GroupId)
            .OnDelete(DeleteBehavior.Cascade);

        // Indexes
        builder.HasIndex(g => g.OwnerId);
        builder.HasIndex(g => g.CreatedAt);
        builder.HasIndex(g => g.GroupNumber)
            .IsUnique();
        builder.HasIndex(g => g.AnnouncementUpdatedBy);
        builder.HasIndex(g => g.AnnouncementUpdatedAt);
        builder.HasIndex(g => g.IsPublic);
    }
}
