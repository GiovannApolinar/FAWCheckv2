using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using maize_drs_backend.Authentication;
using maize_drs_backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace maize_drs_backend.Services
{
    public class JwtService
    {
        public const string DefaultRole = AuthConstants.UserRole;

        private readonly IConfiguration _configuration;
        private readonly UserManager<ApplicationUser> _userManager;

        public JwtService(IConfiguration configuration, UserManager<ApplicationUser> userManager)
        {
            _configuration = configuration;
            _userManager = userManager;
        }

        public async Task<string> CreateJwtTokenAsync(ApplicationUser user)
        {
            var role = await GetPrimaryRoleAsync(user);
            var email = user.Email ?? user.UserName ?? string.Empty;
            var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Missing Jwt:Key.");
            var issuer = _configuration["Jwt:Issuer"] ?? throw new InvalidOperationException("Missing Jwt:Issuer.");
            var audience = _configuration["Jwt:Audience"] ?? throw new InvalidOperationException("Missing Jwt:Audience.");

            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
            var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(AuthConstants.LocalUserIdClaimType, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.Name, email),
                new Claim(AuthConstants.SimpleRoleClaimType, role),
                new Claim(ClaimTypes.Role, role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public async Task<string> GetPrimaryRoleAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return roles.FirstOrDefault() ?? DefaultRole;
        }
    }
}
