using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IMSharp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMessageIdIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "idx_private_message_conversation_id",
                table: "private_messages",
                columns: new[] { "SenderId", "ReceiverId", "Id" });

            migrationBuilder.CreateIndex(
                name: "idx_group_message_group_id",
                table: "group_messages",
                columns: new[] { "GroupId", "Id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "idx_private_message_conversation_id",
                table: "private_messages");

            migrationBuilder.DropIndex(
                name: "idx_group_message_group_id",
                table: "group_messages");
        }
    }
}
