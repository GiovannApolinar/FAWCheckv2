using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace maize_drs_backend.Migrations
{
    /// <inheritdoc />
    public partial class MoveAssessmentImagesToBlobStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bytes",
                table: "AssessmentImages");

            migrationBuilder.AddColumn<string>(
                name: "BlobName",
                table: "AssessmentImages",
                type: "nvarchar(512)",
                maxLength: 512,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<long>(
                name: "ContentLength",
                table: "AssessmentImages",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BlobName",
                table: "AssessmentImages");

            migrationBuilder.DropColumn(
                name: "ContentLength",
                table: "AssessmentImages");

            migrationBuilder.AddColumn<byte[]>(
                name: "Bytes",
                table: "AssessmentImages",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);
        }
    }
}
