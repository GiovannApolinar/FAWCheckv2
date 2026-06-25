using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using maize_drs_backend.Authentication;
using maize_drs_backend.DTOs;
using maize_drs_backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace maize_drs_backend.Controllers
{
    [ApiController]
    [Authorize(Roles = AuthConstants.AdminRole)]
    [Route("api/admin/users")]
    public class AdminUsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminUsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        [HttpGet("pending")]
        public async Task<ActionResult<IReadOnlyList<PendingUserResponseDto>>> ListPending(CancellationToken cancellationToken)
        {
            var users = await _userManager.Users
                .AsNoTracking()
                .Where(user => !user.IsApproved)
                .OrderBy(user => user.RegisteredAtUtc)
                .Select(user => new PendingUserResponseDto
                {
                    UserId = user.Id.ToString(),
                    Email = user.Email ?? user.UserName ?? string.Empty,
                    RegisteredAtUtc = user.RegisteredAtUtc.ToString("o")
                })
                .ToListAsync(cancellationToken);

            return Ok(users);
        }

        [HttpPost("{id:guid}/approve")]
        public async Task<ActionResult<ApprovedUserResponseDto>> Approve(Guid id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user is null)
            {
                return NotFound();
            }

            if (!user.IsApproved)
            {
                var approvedByUserId = GetCurrentUserId();
                if (approvedByUserId == Guid.Empty)
                {
                    return Unauthorized();
                }

                user.IsApproved = true;
                user.ApprovedAtUtc = DateTime.UtcNow;
                user.ApprovedByUserId = approvedByUserId;

                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                {
                    return BadRequest(string.Join(" ", updateResult.Errors.Select(error => error.Description)));
                }
            }

            return Ok(ToApprovedUserResponse(user));
        }

        private Guid GetCurrentUserId()
        {
            var idClaim = User.FindFirstValue(AuthConstants.LocalUserIdClaimType) ??
                          User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                          User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return Guid.TryParse(idClaim, out var userId) ? userId : Guid.Empty;
        }

        private static ApprovedUserResponseDto ToApprovedUserResponse(ApplicationUser user)
        {
            return new ApprovedUserResponseDto
            {
                UserId = user.Id.ToString(),
                Email = user.Email ?? user.UserName ?? string.Empty,
                RegisteredAtUtc = user.RegisteredAtUtc.ToString("o"),
                ApprovedAtUtc = user.ApprovedAtUtc?.ToString("o") ?? string.Empty,
                ApprovedByUserId = user.ApprovedByUserId?.ToString()
            };
        }
    }
}
