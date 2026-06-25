using System.Net.Http.Json;
using System.Text.Json;
using maize_drs_backend.Authentication;
using maize_drs_backend.Data;
using maize_drs_backend.DTOs;
using maize_drs_backend.Legacy;
using maize_drs_backend.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace maize_drs_backend.Tests;

public class LegacyImportIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public LegacyImportIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task ImportedLegacyBcryptUser_CanLogin_AndIsRehashedToIdentityHash()
    {
        var email = $"legacy-login-{Guid.NewGuid():N}@fawcheck.local";
        const string password = "legacy-password-123";

        using (var scope = _factory.Services.CreateScope())
        {
            var importer = scope.ServiceProvider.GetRequiredService<LegacyImportService>();

            var result = await importer.ImportAsync(
                [
                    new LegacyUserRecord
                    {
                        SourceId = $"user-{Guid.NewGuid():N}",
                        Email = email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                        Role = AuthConstants.UserRole,
                        RegisteredAtUtc = DateTime.UtcNow.AddDays(-7)
                    }
                ],
                Array.Empty<LegacyAssessmentRecord>(),
                CancellationToken.None);

            Assert.Equal(0, result.Failures);
            Assert.Equal(1, result.UsersCreated);
        }

        using var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        loginResponse.EnsureSuccessStatusCode();

        var payload = await loginResponse.Content.ReadFromJsonAsync<AuthenticationResponseDto>();
        Assert.NotNull(payload);
        Assert.Equal(AuthConstants.UserRole, payload!.Role);
        Assert.False(string.IsNullOrWhiteSpace(payload.Token));

        using var verifyScope = _factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var user = await db.Users.AsNoTracking().SingleAsync(x => x.Email == email);

        Assert.True(user.IsApproved);
        Assert.False(string.IsNullOrWhiteSpace(user.PasswordHash));
        Assert.False((user.PasswordHash ?? string.Empty).StartsWith("$2", StringComparison.Ordinal));
    }

    [Fact]
    public async Task LegacyImport_IsIdempotent_ForUsersAndAssessments()
    {
        var email = $"legacy-import-{Guid.NewGuid():N}@fawcheck.local";
        var userRecord = new LegacyUserRecord
        {
            SourceId = $"legacy-user-{Guid.NewGuid():N}",
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
            Role = AuthConstants.AdminRole,
            RegisteredAtUtc = DateTime.UtcNow.AddDays(-14)
        };
        var assessmentRecord = new LegacyAssessmentRecord
        {
            SourceId = $"legacy-assessment-{Guid.NewGuid():N}",
            Email = email,
            AssessedAtUtc = DateTime.UtcNow.AddDays(-5),
            ImageName = "legacy-leaf.png",
            Base64Image = $"data:image/png;base64,{TinyPngBase64}",
            CropStage = "VT",
            LeafFeeding = "yes",
            ShotHoles = "6-8",
            Lesions = "few",
            LarvaeCount = 2,
            Score = 5,
            Description = "Legacy imported assessment"
        };

        LegacyImportResult firstResult;
        LegacyImportResult secondResult;

        using (var scope = _factory.Services.CreateScope())
        {
            var importer = scope.ServiceProvider.GetRequiredService<LegacyImportService>();
            firstResult = await importer.ImportAsync([userRecord], [assessmentRecord], CancellationToken.None);
            secondResult = await importer.ImportAsync([userRecord], [assessmentRecord], CancellationToken.None);
        }

        Assert.Equal(0, firstResult.Failures);
        Assert.Equal(1, firstResult.UsersCreated);
        Assert.Equal(1, firstResult.AssessmentsImported);

        Assert.Equal(0, secondResult.Failures);
        Assert.Equal(1, secondResult.UsersSkipped);
        Assert.Equal(1, secondResult.AssessmentsSkipped);

        using var verifyScope = _factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = verifyScope.ServiceProvider.GetRequiredService<UserManager<Models.ApplicationUser>>();

        var importedUser = await db.Users.AsNoTracking().SingleAsync(x => x.Email == email);
        var importedAssessment = await db.Assessments.AsNoTracking().SingleAsync(x => x.UserId == importedUser.Id);
        var importedImage = await db.AssessmentImages.AsNoTracking().SingleAsync(x => x.AssessmentId == importedAssessment.Id);

        Assert.True(await userManager.IsInRoleAsync(await userManager.FindByIdAsync(importedUser.Id.ToString()) ?? throw new InvalidOperationException(), AuthConstants.AdminRole));
        Assert.Equal($"legacy-{assessmentRecord.SourceId}", importedAssessment.ClientGeneratedId);
        Assert.Equal(assessmentRecord.Score, importedAssessment.RuleScore);
        Assert.Equal(assessmentRecord.Score, importedAssessment.FinalScore);
        Assert.Equal(RuleScoringService.MapResponseBand(assessmentRecord.Score), importedAssessment.ResponseBand);
        Assert.Equal("provisional", importedAssessment.FinalConfidence);
        Assert.Equal(assessmentRecord.Description, importedAssessment.Explanation);
        Assert.Contains("legacy_import", JsonSerializer.Deserialize<List<string>>(importedAssessment.FusionFlagsJson) ?? []);
        Assert.Equal("legacy-leaf.png", importedImage.OriginalFileName);
        Assert.True(_factory.ImageStore.Contains(importedImage.BlobName));
    }

    private const string TinyPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PqQ4kQAAAABJRU5ErkJggg==";
}
