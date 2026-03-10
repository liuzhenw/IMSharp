using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IMSharp.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupNumberAndAnnouncement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create sequence for group numbers
            migrationBuilder.Sql(@"
                CREATE SEQUENCE group_number_seq
                START WITH 10000000
                INCREMENT BY 1
                MINVALUE 10000000
                MAXVALUE 99999999
                NO CYCLE;
            ");

            migrationBuilder.AddColumn<string>(
                name: "Announcement",
                table: "groups",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AnnouncementUpdatedAt",
                table: "groups",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AnnouncementUpdatedBy",
                table: "groups",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroupNumber",
                table: "groups",
                type: "integer",
                nullable: true);

            // Generate group numbers for existing groups
            migrationBuilder.Sql(@"
                UPDATE groups
                SET ""GroupNumber"" = nextval('group_number_seq')
                WHERE ""GroupNumber"" IS NULL;
            ");

            // Make GroupNumber NOT NULL with default value
            migrationBuilder.AlterColumn<int>(
                name: "GroupNumber",
                table: "groups",
                type: "integer",
                nullable: false,
                defaultValueSql: "nextval('group_number_seq')");

            migrationBuilder.CreateIndex(
                name: "IX_groups_AnnouncementUpdatedAt",
                table: "groups",
                column: "AnnouncementUpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_groups_AnnouncementUpdatedBy",
                table: "groups",
                column: "AnnouncementUpdatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_groups_GroupNumber",
                table: "groups",
                column: "GroupNumber",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_groups_users_AnnouncementUpdatedBy",
                table: "groups",
                column: "AnnouncementUpdatedBy",
                principalTable: "users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_groups_users_AnnouncementUpdatedBy",
                table: "groups");

            migrationBuilder.DropIndex(
                name: "IX_groups_AnnouncementUpdatedAt",
                table: "groups");

            migrationBuilder.DropIndex(
                name: "IX_groups_AnnouncementUpdatedBy",
                table: "groups");

            migrationBuilder.DropIndex(
                name: "IX_groups_GroupNumber",
                table: "groups");

            migrationBuilder.DropColumn(
                name: "Announcement",
                table: "groups");

            migrationBuilder.DropColumn(
                name: "AnnouncementUpdatedAt",
                table: "groups");

            migrationBuilder.DropColumn(
                name: "AnnouncementUpdatedBy",
                table: "groups");

            migrationBuilder.DropColumn(
                name: "GroupNumber",
                table: "groups");

            // Drop sequence
            migrationBuilder.Sql("DROP SEQUENCE IF EXISTS group_number_seq;");
        }
    }
}
