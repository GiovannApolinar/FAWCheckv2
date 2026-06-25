using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Globalization;
using maize_drs_backend.Data;
using maize_drs_backend.DTOs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace maize_drs_backend.Tests;

public class AssessmentApiIntegrationTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly ApiWebApplicationFactory _factory;

    public AssessmentApiIntegrationTests(ApiWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Register_CreatesPendingUser_AndRejectsDuplicateEmail()
    {
        using var client = _factory.CreateClient();
        var email = $"register-{Guid.NewGuid():N}@fawcheck.local";

        var registerResponse = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "password123" });
        Assert.Equal(HttpStatusCode.Accepted, registerResponse.StatusCode);
        var registered = await registerResponse.Content.ReadFromJsonAsync<PendingAuthResponseDto>();

        Assert.NotNull(registered);
        Assert.Equal(email, registered.Email);
        Assert.Equal("pending_approval", registered.Status);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.AsNoTracking().SingleAsync(x => x.Email == email);

            Assert.False(user.IsApproved);
            Assert.Equal(email, user.UserName);
            Assert.NotEqual(default, user.RegisteredAtUtc);
            Assert.Null(user.ApprovedAtUtc);
            Assert.Null(user.ApprovedByUserId);
        }

        var duplicateResponse = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "password123" });
        Assert.Equal(HttpStatusCode.BadRequest, duplicateResponse.StatusCode);
    }

    [Fact]
    public async Task Login_BlocksPendingUser_AndRejectsInvalidCredentials()
    {
        using var client = _factory.CreateClient();
        var email = $"login-{Guid.NewGuid():N}@fawcheck.local";

        await RequestAccessAsync(client, email);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "password123" });
        Assert.Equal(HttpStatusCode.Forbidden, loginResponse.StatusCode);
        var blocked = await loginResponse.Content.ReadFromJsonAsync<PendingAuthResponseDto>();

        Assert.NotNull(blocked);
        Assert.Equal(email, blocked!.Email);
        Assert.Equal("pending_approval", blocked.Status);

        var invalidResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "wrong-password" });
        Assert.Equal(HttpStatusCode.Unauthorized, invalidResponse.StatusCode);
    }

    [Fact]
    public async Task BootstrapAdmin_CanApprovePendingUser_AndApprovalIsIdempotent()
    {
        using var userClient = _factory.CreateClient();
        using var adminClient = _factory.CreateClient();
        var email = $"approval-{Guid.NewGuid():N}@fawcheck.local";

        await RequestAccessAsync(userClient, email);

        var adminLogin = await LoginAsync(adminClient, _factory.BootstrapAdminEmail, _factory.BootstrapAdminPassword);
        Assert.Equal("Admin", adminLogin.Role);

        adminClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);

        var pendingUsers = await adminClient.GetFromJsonAsync<List<PendingUserResponseDto>>("/api/admin/users/pending");
        Assert.NotNull(pendingUsers);
        var pendingUser = pendingUsers!.Single(x => x.Email == email);

        var approveResponse = await adminClient.PostAsync($"/api/admin/users/{pendingUser.UserId}/approve", null);
        approveResponse.EnsureSuccessStatusCode();
        var approved = await approveResponse.Content.ReadFromJsonAsync<ApprovedUserResponseDto>();

        Assert.NotNull(approved);
        Assert.Equal(pendingUser.UserId, approved!.UserId);
        Assert.Equal(email, approved.Email);
        Assert.False(string.IsNullOrWhiteSpace(approved.ApprovedAtUtc));

        var secondApproveResponse = await adminClient.PostAsync($"/api/admin/users/{pendingUser.UserId}/approve", null);
        secondApproveResponse.EnsureSuccessStatusCode();

        var loggedInUser = await LoginAsync(userClient, email, "password123");
        Assert.Equal("User", loggedInUser.Role);
        Assert.False(string.IsNullOrWhiteSpace(loggedInUser.Token));

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var approvedUser = await db.Users.AsNoTracking().SingleAsync(x => x.Email == email);
        var adminUser = await db.Users.AsNoTracking().SingleAsync(x => x.Email == _factory.BootstrapAdminEmail);

        Assert.True(approvedUser.IsApproved);
        Assert.NotNull(approvedUser.ApprovedAtUtc);
        Assert.Equal(adminUser.Id, approvedUser.ApprovedByUserId);
    }

    [Fact]
    public async Task NonAdmin_CannotAccessAdminEndpoints()
    {
        using var userClient = _factory.CreateClient();
        var token = await CreateApprovedUserTokenAsync(userClient, $"nonadmin-{Guid.NewGuid():N}@fawcheck.local");
        userClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var pendingResponse = await userClient.GetAsync("/api/admin/users/pending");
        Assert.Equal(HttpStatusCode.Forbidden, pendingResponse.StatusCode);

        var approveResponse = await userClient.PostAsync($"/api/admin/users/{Guid.NewGuid()}/approve", null);
        Assert.Equal(HttpStatusCode.Forbidden, approveResponse.StatusCode);
    }

    [Fact]
    public async Task AuthenticatedUser_CanViewUpdateAndDeleteOwnProfile()
    {
        using var client = _factory.CreateClient();
        var email = $"profile-{Guid.NewGuid():N}@fawcheck.local";
        var token = await CreateApprovedUserTokenAsync(client, email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var initialProfile = await client.GetFromJsonAsync<ProfileResponseDto>("/api/profile");
        Assert.NotNull(initialProfile);
        Assert.Equal(email, initialProfile!.Email);
        Assert.Equal("User", initialProfile.Role);
        Assert.True(initialProfile.CanDeleteAccount);
        Assert.Equal(string.Empty, initialProfile.Name);
        Assert.Equal(string.Empty, initialProfile.Section);

        var updateResponse = await client.PutAsJsonAsync("/api/profile", new { name = "Field Tester", section = "A-1" });
        updateResponse.EnsureSuccessStatusCode();
        var updatedProfile = await updateResponse.Content.ReadFromJsonAsync<ProfileResponseDto>();

        Assert.NotNull(updatedProfile);
        Assert.Equal("Field Tester", updatedProfile!.Name);
        Assert.Equal("A-1", updatedProfile.Section);
        Assert.True(updatedProfile.CanDeleteAccount);

        var saveResponse = await client.PostAsJsonAsync("/api/assessment/evaluate-save", BuildRequest());
        saveResponse.EnsureSuccessStatusCode();
        var saved = await saveResponse.Content.ReadFromJsonAsync<EvaluateSaveResponseDto>();
        Assert.NotNull(saved);

        var assessmentId = Guid.Parse(saved!.RecordId);
        string blobName;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var user = await db.Users.AsNoTracking().SingleAsync(x => x.Email == email);
            var image = await db.AssessmentImages.AsNoTracking().SingleAsync(x => x.AssessmentId == assessmentId);

            Assert.Equal("Field Tester", user.DisplayName);
            Assert.Equal("A-1", user.Section);
            blobName = image.BlobName;
            Assert.True(_factory.ImageStore.Contains(blobName));
        }

        var deleteResponse = await client.DeleteAsync("/api/profile");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.False(await verifyDb.Users.AnyAsync(x => x.Email == email));
        Assert.False(await verifyDb.Assessments.AnyAsync(x => x.Id == assessmentId));
        Assert.False(await verifyDb.AssessmentImages.AnyAsync(x => x.AssessmentId == assessmentId));
        Assert.False(_factory.ImageStore.Contains(blobName));
    }

    [Fact]
    public async Task AdminProfile_CanRenameButCannotDeleteAccount()
    {
        using var client = _factory.CreateClient();
        var login = await LoginAsync(client, _factory.BootstrapAdminEmail, _factory.BootstrapAdminPassword);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login.Token);

        var initialProfile = await client.GetFromJsonAsync<ProfileResponseDto>("/api/profile");
        Assert.NotNull(initialProfile);
        Assert.Equal(_factory.BootstrapAdminEmail, initialProfile!.Email);
        Assert.Equal("Admin", initialProfile.Role);
        Assert.False(initialProfile.CanDeleteAccount);
        Assert.Equal(string.Empty, initialProfile.Section);

        var updateResponse = await client.PutAsJsonAsync("/api/profile", new { name = "Lead Admin", section = "Admin Desk" });
        updateResponse.EnsureSuccessStatusCode();
        var updatedProfile = await updateResponse.Content.ReadFromJsonAsync<ProfileResponseDto>();

        Assert.NotNull(updatedProfile);
        Assert.Equal("Lead Admin", updatedProfile!.Name);
        Assert.Equal("Admin Desk", updatedProfile.Section);
        Assert.False(updatedProfile.CanDeleteAccount);

        var deleteResponse = await client.DeleteAsync("/api/profile");
        Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);
        Assert.Equal("Admin accounts cannot be deleted.", await deleteResponse.Content.ReadAsStringAsync());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var adminUser = await db.Users.AsNoTracking().SingleAsync(x => x.Email == _factory.BootstrapAdminEmail);

        Assert.Equal("Lead Admin", adminUser.DisplayName);
        Assert.Equal("Admin Desk", adminUser.Section);
        Assert.True(adminUser.IsApproved);
    }

    [Fact]
    public async Task EvaluateSave_WithoutToken_ReturnsUnauthorized()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/assessment/evaluate-save", BuildRequest());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Health_ReturnsOk()
    {
        using var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task AuthenticatedUser_CanSaveListDetailImageDeleteAndExport()
    {
        using var client = _factory.CreateClient();
        var email = $"assessment-{Guid.NewGuid():N}@fawcheck.local";
        var token = await CreateApprovedUserTokenAsync(client, email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var saveResponse = await client.PostAsJsonAsync("/api/assessment/evaluate-save", BuildRequest());
        saveResponse.EnsureSuccessStatusCode();
        var saved = await saveResponse.Content.ReadFromJsonAsync<EvaluateSaveResponseDto>();

        Assert.NotNull(saved);
        Assert.False(string.IsNullOrWhiteSpace(saved!.RecordId));

        var list = await client.GetFromJsonAsync<PagedAssessmentsResponseDto>("/api/assessment?page=1&pageSize=10");
        Assert.NotNull(list);
        Assert.Contains(list!.Items, item => item.RecordId == saved.RecordId);

        var detailResponse = await client.GetAsync($"/api/assessment/{saved.RecordId}");
        detailResponse.EnsureSuccessStatusCode();
        var detail = await detailResponse.Content.ReadFromJsonAsync<AssessmentDetailDto>();

        Assert.NotNull(detail);
        Assert.Equal(saved.RecordId, detail!.RecordId);
        Assert.False(string.IsNullOrWhiteSpace(detail.ImageUrl));
        Assert.EndsWith($"/api/assessment/{saved.RecordId}/image", detail.ImageUrl);

        var imageResponse = await client.GetAsync($"/api/assessment/{saved.RecordId}/image");
        imageResponse.EnsureSuccessStatusCode();
        Assert.Equal("image/png", imageResponse.Content.Headers.ContentType?.MediaType);
        var imageBytes = await imageResponse.Content.ReadAsByteArrayAsync();
        Assert.NotEmpty(imageBytes);

        var csvResponse = await client.GetAsync("/api/assessment/export/csv");
        csvResponse.EnsureSuccessStatusCode();
        var csvContent = await csvResponse.Content.ReadAsStringAsync();
        Assert.Contains("AssessedAtUtc", csvContent);

        Guid assessmentId = Guid.Parse(saved.RecordId);

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var assessment = await db.Assessments.AsNoTracking().SingleAsync(x => x.Id == assessmentId);
            var image = await db.AssessmentImages.AsNoTracking().SingleAsync(x => x.AssessmentId == assessmentId);
            var user = await db.Users.AsNoTracking().SingleAsync(x => x.Email == email);

            Assert.Equal(user.Id, assessment.UserId);
            Assert.Equal("leaf.jpg", image.OriginalFileName);
            Assert.Equal("image/png", image.ContentType);
            Assert.False(string.IsNullOrWhiteSpace(image.BlobName));
            Assert.True(image.ContentLength > 0);
            Assert.True(_factory.ImageStore.Contains(image.BlobName));
        }

        var deleteResponse = await client.DeleteAsync($"/api/assessment/{saved.RecordId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var imageMetadata = await verifyDb.AssessmentImages.AsNoTracking().FirstOrDefaultAsync(x => x.AssessmentId == assessmentId);
        Assert.False(await verifyDb.Assessments.AnyAsync(x => x.Id == assessmentId));
        Assert.Null(imageMetadata);
    }

    [Fact]
    public async Task Detail_UsesForwardedHttpsOrigin_ForGeneratedImageUrl()
    {
        using var client = _factory.CreateClient();
        var email = $"assessment-forwarded-{Guid.NewGuid():N}@fawcheck.local";
        var token = await CreateApprovedUserTokenAsync(client, email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var saveResponse = await client.PostAsJsonAsync("/api/assessment/evaluate-save", BuildRequest());
        saveResponse.EnsureSuccessStatusCode();
        var saved = await saveResponse.Content.ReadFromJsonAsync<EvaluateSaveResponseDto>();

        Assert.NotNull(saved);

        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/assessment/{saved!.RecordId}");
        request.Headers.TryAddWithoutValidation("X-Forwarded-Proto", "https");
        request.Headers.TryAddWithoutValidation("X-Forwarded-Host", "api.example.com");

        var detailResponse = await client.SendAsync(request);
        detailResponse.EnsureSuccessStatusCode();

        var detail = await detailResponse.Content.ReadFromJsonAsync<AssessmentDetailDto>();
        Assert.NotNull(detail);
        Assert.True(Uri.TryCreate(detail!.ImageUrl, UriKind.Absolute, out var imageUri));
        Assert.Equal("https", imageUri!.Scheme);
        Assert.Equal("api.example.com", imageUri.Host);
        Assert.EndsWith($"/api/assessment/{saved.RecordId}/image", imageUri.AbsoluteUri);
    }

    [Fact]
    public async Task AuthenticatedUser_CanUpdateSavedAssessment()
    {
        using var client = _factory.CreateClient();
        var email = $"assessment-update-{Guid.NewGuid():N}@fawcheck.local";
        var token = await CreateApprovedUserTokenAsync(client, email);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var saveResponse = await client.PostAsJsonAsync("/api/assessment/evaluate-save", BuildRequest());
        saveResponse.EnsureSuccessStatusCode();
        var saved = await saveResponse.Content.ReadFromJsonAsync<EvaluateSaveResponseDto>();

        Assert.NotNull(saved);

        var detailBefore = await client.GetFromJsonAsync<AssessmentDetailDto>($"/api/assessment/{saved!.RecordId}");
        Assert.NotNull(detailBefore);

        Guid assessmentId = Guid.Parse(saved.RecordId);
        string previousBlobName;

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var image = await db.AssessmentImages.AsNoTracking().SingleAsync(x => x.AssessmentId == assessmentId);
            previousBlobName = image.BlobName;
        }

        var updateRequest = BuildRequest();
        updateRequest.ClientGeneratedId = detailBefore!.ClientGeneratedId;
        updateRequest.AssessedAtUtc = DateTime.Parse(
            detailBefore.AssessedAtUtc,
            CultureInfo.InvariantCulture,
            DateTimeStyles.RoundtripKind);
        updateRequest.Dap = 45;
        updateRequest.LocationText = "Updated field";
        updateRequest.ImageName = "updated-leaf.png";
        updateRequest.Symptoms = new SymptomInputDto
        {
            LeafFeedingDamage = true,
            OlderLeavesWithPinholeCount = 2,
            ShotHoleLeafBand = "many_8_10",
            ElongatedLesionBand = "many_all_sizes",
            HoleBand = "many_mid_large",
            WhorlFurlDestruction = "partial",
            PlantDying = true,
            LarvaeCount = 4
        };

        var updateResponse = await client.PutAsJsonAsync($"/api/assessment/{saved.RecordId}", updateRequest);
        updateResponse.EnsureSuccessStatusCode();
        var updated = await updateResponse.Content.ReadFromJsonAsync<EvaluateSaveResponseDto>();

        Assert.NotNull(updated);
        Assert.Equal(saved.RecordId, updated!.RecordId);

        var detailAfter = await client.GetFromJsonAsync<AssessmentDetailDto>($"/api/assessment/{saved.RecordId}");
        Assert.NotNull(detailAfter);
        Assert.Equal(45, detailAfter!.Dap);
        Assert.Equal("Updated field", detailAfter.LocationText);
        Assert.Equal("updated-leaf.png", detailAfter.ImageName);
        Assert.Equal("many_mid_large", detailAfter.Symptoms.HoleBand);
        Assert.Equal(4, detailAfter.Symptoms.LarvaeCount);

        using var verifyScope = _factory.Services.CreateScope();
        var verifyDb = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var assessment = await verifyDb.Assessments.AsNoTracking().SingleAsync(x => x.Id == assessmentId);
        var imageMetadata = await verifyDb.AssessmentImages.AsNoTracking().SingleAsync(x => x.AssessmentId == assessmentId);

        Assert.Equal(45, assessment.Dap);
        Assert.Equal("Updated field", assessment.LocationText);
        Assert.Equal("updated-leaf.png", assessment.ImageName);
        Assert.Equal("many_mid_large", assessment.HoleBand);
        Assert.Equal(4, assessment.LarvaeCount);
        Assert.NotEqual(previousBlobName, imageMetadata.BlobName);
        Assert.False(_factory.ImageStore.Contains(previousBlobName));
        Assert.True(_factory.ImageStore.Contains(imageMetadata.BlobName));
    }

    [Fact]
    public async Task EvaluateSave_RejectsUnsupportedContentType()
    {
        using var client = _factory.CreateClient();
        var token = await CreateApprovedUserTokenAsync(client, $"mime-{Guid.NewGuid():N}@fawcheck.local");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var request = BuildRequest();
        request.ImageBase64 = "data:application/pdf;base64,ZmFrZQ==";
        request.ImageName = "invalid.pdf";

        var response = await client.PostAsJsonAsync("/api/assessment/evaluate-save", request);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UserCannotAccessAnotherUsersImageOrDeleteAnotherUsersRecord()
    {
        using var ownerClient = _factory.CreateClient();
        using var otherClient = _factory.CreateClient();

        var ownerToken = await CreateApprovedUserTokenAsync(ownerClient, $"owner-{Guid.NewGuid():N}@fawcheck.local");
        var otherToken = await CreateApprovedUserTokenAsync(otherClient, $"other-{Guid.NewGuid():N}@fawcheck.local");

        ownerClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", ownerToken);
        otherClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", otherToken);

        var saveResponse = await ownerClient.PostAsJsonAsync("/api/assessment/evaluate-save", BuildRequest());
        saveResponse.EnsureSuccessStatusCode();
        var saved = await saveResponse.Content.ReadFromJsonAsync<EvaluateSaveResponseDto>();

        Assert.NotNull(saved);

        var imageResponse = await otherClient.GetAsync($"/api/assessment/{saved!.RecordId}/image");
        Assert.Equal(HttpStatusCode.NotFound, imageResponse.StatusCode);

        var deleteResponse = await otherClient.DeleteAsync($"/api/assessment/{saved.RecordId}");
        Assert.Equal(HttpStatusCode.NotFound, deleteResponse.StatusCode);

        using var verifyScope = _factory.Services.CreateScope();
        var db = verifyScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        Assert.True(await db.Assessments.AnyAsync(x => x.Id == Guid.Parse(saved.RecordId)));
    }

    private static EvaluateSaveRequestDto BuildRequest()
    {
        return new EvaluateSaveRequestDto
        {
            ClientGeneratedId = Guid.NewGuid().ToString("N"),
            AssessedAtUtc = DateTime.UtcNow,
            Dap = 30,
            LocationText = "Test field",
            ImageName = "leaf.jpg",
            ImageBase64 = $"data:image/png;base64,{TinyPngBase64}",
            Symptoms = new SymptomInputDto
            {
                LeafFeedingDamage = true,
                OlderLeavesWithPinholeCount = 1,
                ShotHoleLeafBand = "few_lt5",
                ElongatedLesionBand = "few_small_upto_1_3cm",
                HoleBand = "few_small_mid",
                WhorlFurlDestruction = "none",
                PlantDying = false,
                LarvaeCount = 1
            }
        };
    }

    private async Task<PendingAuthResponseDto> RequestAccessAsync(HttpClient client, string email, string password = "password123")
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var registered = await response.Content.ReadFromJsonAsync<PendingAuthResponseDto>();
        Assert.NotNull(registered);
        Assert.Equal(email, registered!.Email);
        return registered;
    }

    private static async Task<AuthenticationResponseDto> LoginAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var authenticated = await response.Content.ReadFromJsonAsync<AuthenticationResponseDto>();
        Assert.NotNull(authenticated);
        Assert.False(string.IsNullOrWhiteSpace(authenticated!.Token));
        return authenticated;
    }

    private async Task<ApprovedUserResponseDto> ApproveUserAsync(string email)
    {
        using var adminClient = _factory.CreateClient();
        var adminLogin = await LoginAsync(adminClient, _factory.BootstrapAdminEmail, _factory.BootstrapAdminPassword);
        adminClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", adminLogin.Token);

        var pendingUsers = await adminClient.GetFromJsonAsync<List<PendingUserResponseDto>>("/api/admin/users/pending");
        Assert.NotNull(pendingUsers);

        var pendingUser = pendingUsers!.Single(x => x.Email == email);
        var response = await adminClient.PostAsync($"/api/admin/users/{pendingUser.UserId}/approve", null);
        response.EnsureSuccessStatusCode();

        var approved = await response.Content.ReadFromJsonAsync<ApprovedUserResponseDto>();
        Assert.NotNull(approved);
        return approved!;
    }

    private async Task<string> CreateApprovedUserTokenAsync(HttpClient client, string email, string password = "password123")
    {
        await RequestAccessAsync(client, email, password);
        await ApproveUserAsync(email);
        var authenticated = await LoginAsync(client, email, password);
        return authenticated.Token;
    }

    private const string TinyPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PqQ4kQAAAABJRU5ErkJggg==";
}
