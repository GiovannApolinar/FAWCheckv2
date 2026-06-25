using maize_drs_backend.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace maize_drs_backend.Tests;

public class ApiWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string DefaultBootstrapAdminEmail = "admin@fawcheck.local";
    public const string DefaultBootstrapAdminPassword = "admin-password-123";

    public InMemoryAssessmentImageStore ImageStore { get; } = new();
    public string BootstrapAdminEmail => DefaultBootstrapAdminEmail;
    public string BootstrapAdminPassword => DefaultBootstrapAdminPassword;

    public ApiWebApplicationFactory()
    {
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", "Development");
        Environment.SetEnvironmentVariable("Database__Provider", "InMemory");
        Environment.SetEnvironmentVariable("Database__Name", $"maize-drs-tests-{Guid.NewGuid():N}");
        Environment.SetEnvironmentVariable("Database__AutoMigrate", "true");
        Environment.SetEnvironmentVariable("BlobStorage__Provider", "InMemory");
        Environment.SetEnvironmentVariable("Jwt__Key", "IntegrationTestsJwtKey1234567890!");
        Environment.SetEnvironmentVariable("Jwt__Issuer", "maize-drs-tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "maize-drs-tests");
        Environment.SetEnvironmentVariable("Inference__BaseUrl", "http://inference.test");
        Environment.SetEnvironmentVariable("Inference__PredictPath", "/predict");
        Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", "http://localhost:3000");
        Environment.SetEnvironmentVariable("Auth__BootstrapAdminEmail", DefaultBootstrapAdminEmail);
        Environment.SetEnvironmentVariable("Auth__BootstrapAdminPassword", DefaultBootstrapAdminPassword);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Development");
        builder.UseSetting("Database:Provider", "InMemory");
        builder.UseSetting("Database:Name", $"maize-drs-tests-{Guid.NewGuid():N}");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            var testSettings = new Dictionary<string, string?>
            {
                ["Database:Provider"] = "InMemory",
                ["Database:Name"] = $"maize-drs-tests-{Guid.NewGuid():N}",
                ["Database:AutoMigrate"] = "true",
                ["BlobStorage:Provider"] = "InMemory",
                ["Jwt:Key"] = "IntegrationTestsJwtKey1234567890!",
                ["Jwt:Issuer"] = "maize-drs-tests",
                ["Jwt:Audience"] = "maize-drs-tests",
                ["Inference:BaseUrl"] = "http://inference.test",
                ["Inference:PredictPath"] = "/predict",
                ["Cors:AllowedOrigins:0"] = "http://localhost:3000",
                ["Auth:BootstrapAdminEmail"] = DefaultBootstrapAdminEmail,
                ["Auth:BootstrapAdminPassword"] = DefaultBootstrapAdminPassword
            };

            configBuilder.AddInMemoryCollection(testSettings);
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IInferenceClient>();
            services.AddSingleton<IInferenceClient>(new FakeInferenceClient());
            services.RemoveAll<IAssessmentImageStore>();
            services.AddSingleton<IAssessmentImageStore>(ImageStore);
        });
    }

    private sealed class FakeInferenceClient : IInferenceClient
    {
        public Task<InferenceResult?> PredictAsync(
            byte[] imageBytes,
            string fileName,
            string mimeType,
            CancellationToken cancellationToken)
        {
            return Task.FromResult<InferenceResult?>(new InferenceResult("damaged", 88));
        }
    }
}
