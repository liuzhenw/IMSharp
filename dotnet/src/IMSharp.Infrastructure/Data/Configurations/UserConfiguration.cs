using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Username)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.DisplayName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.Email)
            .HasMaxLength(255);

        builder.Property(u => u.Avatar)
            .HasMaxLength(500);

        builder.Property(u => u.OAuthProvider)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.OAuthId)
            .IsRequired()
            .HasMaxLength(255);

        // Unique indexes
        builder.HasIndex(u => u.Username)
            .IsUnique()
            .HasDatabaseName("idx_user_username");

        builder.HasIndex(u => u.Email)
            .IsUnique()
            .HasDatabaseName("idx_user_email");

        builder.HasIndex(u => new { u.OAuthProvider, u.OAuthId })
            .IsUnique()
            .HasDatabaseName("idx_user_oauth");

        // Regular indexes
        builder.HasIndex(u => u.IsOnline)
            .HasDatabaseName("idx_user_is_online");

        // Relationships
        builder.HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
