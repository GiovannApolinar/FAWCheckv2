using maize_drs_backend.Models;
using Microsoft.AspNetCore.Identity;

namespace maize_drs_backend.Services
{
    public class LegacyCompatiblePasswordHasher : IPasswordHasher<ApplicationUser>
    {
        private readonly PasswordHasher<ApplicationUser> _innerHasher = new();

        public string HashPassword(ApplicationUser user, string password)
        {
            return _innerHasher.HashPassword(user, password);
        }

        public PasswordVerificationResult VerifyHashedPassword(
            ApplicationUser user,
            string hashedPassword,
            string providedPassword)
        {
            if (string.IsNullOrWhiteSpace(hashedPassword))
            {
                return PasswordVerificationResult.Failed;
            }

            if (!hashedPassword.StartsWith("$2", StringComparison.Ordinal))
            {
                return _innerHasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
            }

            try
            {
                return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword)
                    ? PasswordVerificationResult.SuccessRehashNeeded
                    : PasswordVerificationResult.Failed;
            }
            catch (Exception)
            {
                return PasswordVerificationResult.Failed;
            }
        }
    }
}
