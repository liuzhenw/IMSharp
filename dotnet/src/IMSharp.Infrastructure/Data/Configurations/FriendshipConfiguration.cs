using IMSharp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IMSharp.Infrastructure.Data.Configurations;

public class FriendshipConfiguration : IEntityTypeConfiguration<Friendship>
{
    public void Configure(EntityTypeBuilder<Friendship> builder)
    {
        builder.ToTable("friendships");

        builder.HasKey(f => f.Id);

        builder.Property(f => f.Remark)
            .HasMaxLength(100);

        // Indexes
        builder.HasIndex(f => f.UserId)
            .HasDatabaseName("idx_friendship_user");

        builder.HasIndex(f => f.FriendId)
            .HasDatabaseName("idx_friendship_friend");

        builder.HasIndex(f => new { f.UserId, f.FriendId })
            .IsUnique()
            .HasDatabaseName("idx_friendship_user_friend");

        // Relationships
        builder.HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(f => f.Friend)
            .WithMany()
            .HasForeignKey(f => f.FriendId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
