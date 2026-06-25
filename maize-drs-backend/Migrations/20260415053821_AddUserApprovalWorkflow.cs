using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace maize_drs_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserApprovalWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByUserId",
                table: "AspNetUsers",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsApproved",
                table: "AspNetUsers",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegisteredAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [AspNetUsers]
                SET
                    [RegisteredAtUtc] = COALESCE([RegisteredAtUtc], SYSUTCDATETIME()),
                    [IsApproved] = COALESCE([IsApproved], CAST(1 AS bit)),
                    [ApprovedAtUtc] = COALESCE([ApprovedAtUtc], SYSUTCDATETIME())
                """);

            migrationBuilder.AlterColumn<bool>(
                name: "IsApproved",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "bit",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "RegisteredAtUtc",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsApproved_RegisteredAtUtc",
                table: "AspNetUsers",
                columns: new[] { "IsApproved", "RegisteredAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_IsApproved_RegisteredAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ApprovedByUserId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsApproved",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "RegisteredAtUtc",
                table: "AspNetUsers");
        }
    }
}
