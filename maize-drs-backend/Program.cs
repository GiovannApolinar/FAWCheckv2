using System.Text;
using maize_drs_backend.Authentication;
using maize_drs_backend.Data;
using maize_drs_backend.Models;
using maize_drs_backend.Options;
using maize_drs_backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.Configure<BlobStorageOptions>(builder.Configuration.GetSection(BlobStorageOptions.SectionName));

var databaseProvider = builder.Configuration["Database:Provider"] ?? "SqlServer";
if (databaseProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
{
    var databaseName = builder.Configuration["Database:Name"] ?? "maize-drs-inmemory";
    builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseInMemoryDatabase(databaseName));
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));
}

builder.Services
    .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
    {
        options.User.RequireUniqueEmail = true;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequiredLength = 6;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();
builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, LegacyCompatiblePasswordHasher>();

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(jwtKey) ||
    string.IsNullOrWhiteSpace(jwtIssuer) ||
    string.IsNullOrWhiteSpace(jwtAudience))
{
    throw new InvalidOperationException("Missing Jwt configuration. Set Jwt:Key, Jwt:Issuer, and Jwt:Audience.");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = AuthConstants.JwtScheme;
        options.DefaultChallengeScheme = AuthConstants.JwtScheme;
        options.DefaultScheme = AuthConstants.JwtScheme;
    })
    .AddJwtBearer(AuthConstants.JwtScheme, options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor |
        ForwardedHeaders.XForwardedProto |
        ForwardedHeaders.XForwardedHost;

    // Container Apps ingress sits in front of the app, so trust forwarded headers from the proxy.
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        if (allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
            return;
        }

        throw new InvalidOperationException("Missing Cors:AllowedOrigins configuration for non-development environments.");
    });
});

builder.Services.AddScoped<RuleScoringService>();
builder.Services.AddScoped<FusionService>();
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<LegacyImportService>();
builder.Services.AddHttpClient<IInferenceClient, InferenceClient>();

var blobStorageProvider = builder.Configuration["BlobStorage:Provider"] ?? "AzureBlob";
if (blobStorageProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
{
    builder.Services.AddSingleton<IAssessmentImageStore, InMemoryAssessmentImageStore>();
}
else
{
    builder.Services.AddSingleton<IAssessmentImageStore, AzureBlobAssessmentImageStore>();
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

var shouldAutoMigrate = builder.Configuration.GetValue<bool?>("Database:AutoMigrate")
    ?? builder.Environment.IsDevelopment();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        if (shouldAutoMigrate)
        {
            if (db.Database.IsRelational())
            {
                db.Database.Migrate();
            }
            else
            {
                db.Database.EnsureCreated();
            }
        }

        await AuthBootstrapper.EnsureConfiguredAdminAsync(scope.ServiceProvider, app.Logger);
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical(ex, "Database initialization failed during startup.");
        throw;
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();
app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api"))
    {
        context.Response.OnStarting(() =>
        {
            context.Response.Headers.CacheControl = "no-store";
            return Task.CompletedTask;
        });
    }

    await next();
});

app.MapGet("/health", () => Results.Ok(new
{
    status = "ok",
    environment = app.Environment.EnvironmentName
}));
app.MapControllers();

app.Run();

public partial class Program
{
}
