using maize_drs_backend.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace maize_drs_backend
{
    public class DesignTimeApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        public ApplicationDbContext CreateDbContext(string[] args)
        {
            var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
            var databaseProvider = configuration["Database:Provider"] ?? "SqlServer";

            if (databaseProvider.Equals("InMemory", StringComparison.OrdinalIgnoreCase))
            {
                var databaseName = configuration["Database:Name"] ?? "maize-drs-design";
                optionsBuilder.UseInMemoryDatabase(databaseName);
            }
            else
            {
                var connectionString = configuration.GetConnectionString("Default");
                if (string.IsNullOrWhiteSpace(connectionString))
                {
                    throw new InvalidOperationException("Missing ConnectionStrings:Default for design-time DbContext creation.");
                }

                optionsBuilder.UseSqlServer(connectionString);
            }

            return new ApplicationDbContext(optionsBuilder.Options);
        }
    }
}
