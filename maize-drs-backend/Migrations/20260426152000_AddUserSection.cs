using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace maize_drs_backend.Migrations
{
    /// <inheritdoc />
    public partial class AddUserSection : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Section",
                table: "AspNetUsers",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Section",
                table: "AspNetUsers");
        }
    }
}
