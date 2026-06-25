using maize_drs_backend.Authentication;
using maize_drs_backend.Models;
using Microsoft.AspNetCore.Identity;

namespace maize_drs_backend.Services
{
    public static class AuthBootstrapper
    {
        public static async Task EnsureConfiguredAdminAsync(IServiceProvider services, ILogger logger)
        {
            var configuration = services.GetRequiredService<IConfiguration>();
            var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

            if (!await roleManager.RoleExistsAsync(AuthConstants.AdminRole))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole<Guid>(AuthConstants.AdminRole));
                if (!roleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to create the {AuthConstants.AdminRole} role: {string.Join(" ", roleResult.Errors.Select(error => error.Description))}");
                }
            }

            var bootstrapEmail = configuration["Auth:BootstrapAdminEmail"]?.Trim();
            var bootstrapPassword = configuration["Auth:BootstrapAdminPassword"];
            var hasBootstrapEmail = !string.IsNullOrWhiteSpace(bootstrapEmail);
            var hasBootstrapPassword = !string.IsNullOrWhiteSpace(bootstrapPassword);

            if (hasBootstrapEmail != hasBootstrapPassword)
            {
                throw new InvalidOperationException("Auth:BootstrapAdminEmail and Auth:BootstrapAdminPassword must both be set together.");
            }

            var existingAdmins = await userManager.GetUsersInRoleAsync(AuthConstants.AdminRole);
            var hasApprovedAdmin = existingAdmins.Any(user => user.IsApproved);
            if (!hasBootstrapEmail)
            {
                if (!hasApprovedAdmin)
                {
                    throw new InvalidOperationException(
                        "Set Auth:BootstrapAdminEmail and Auth:BootstrapAdminPassword when no approved admin account exists.");
                }

                return;
            }

            var email = bootstrapEmail!;
            var user = await userManager.FindByEmailAsync(email);
            if (user is null)
            {
                var utcNow = DateTime.UtcNow;
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    EmailConfirmed = true,
                    RegisteredAtUtc = utcNow,
                    IsApproved = true,
                    ApprovedAtUtc = utcNow
                };

                var createResult = await userManager.CreateAsync(user, bootstrapPassword!);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to create bootstrap admin account: {string.Join(" ", createResult.Errors.Select(error => error.Description))}");
                }

                logger.LogInformation("Created bootstrap admin account for {Email}.", email);
            }
            else
            {
                var shouldUpdateUser = false;

                if (user.RegisteredAtUtc == default)
                {
                    user.RegisteredAtUtc = DateTime.UtcNow;
                    shouldUpdateUser = true;
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    shouldUpdateUser = true;
                }

                if (!user.IsApproved)
                {
                    user.IsApproved = true;
                    user.ApprovedAtUtc = DateTime.UtcNow;
                    user.ApprovedByUserId = null;
                    shouldUpdateUser = true;
                }
                else if (user.ApprovedAtUtc is null)
                {
                    user.ApprovedAtUtc = DateTime.UtcNow;
                    shouldUpdateUser = true;
                }

                if (shouldUpdateUser)
                {
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Failed to update bootstrap admin account: {string.Join(" ", updateResult.Errors.Select(error => error.Description))}");
                    }
                }
            }

            if (!await userManager.IsInRoleAsync(user, AuthConstants.AdminRole))
            {
                var addToRoleResult = await userManager.AddToRoleAsync(user, AuthConstants.AdminRole);
                if (!addToRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to grant the {AuthConstants.AdminRole} role: {string.Join(" ", addToRoleResult.Errors.Select(error => error.Description))}");
                }
            }
        }
    }
}
