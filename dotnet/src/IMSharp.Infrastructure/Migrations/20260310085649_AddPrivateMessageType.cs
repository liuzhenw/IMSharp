using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IMSharp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPrivateMessageType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "private_messages",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Text");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "private_messages");
        }
    }
}
