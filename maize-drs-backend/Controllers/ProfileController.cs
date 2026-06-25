using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using maize_drs_backend.Authentication;
using maize_drs_backend.Data;
using maize_drs_backend.DTOs;
using maize_drs_backend.Models;
using maize_drs_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace maize_drs_backend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/profile")]
    public class ProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAssessmentImageStore _assessmentImageStore;

        public ProfileController(
            ApplicationDbContext db,
            UserManager<ApplicationUser> userManager,
            IAssessmentImageStore assessmentImageStore)
        {
            _db = db;
            _userManager = userManager;
            _assessmentImageStore = assessmentImageStore;
        }

        [HttpGet]
        public async Task<ActionResult<ProfileResponseDto>> Get(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var user = await _userManager.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == userId, cancellationToken);

            if (user is null)
            {
                return Unauthorized();
            }

            var role = await GetPrimaryRoleAsync(user);
            return Ok(ToProfileResponse(user, role));
        }

        [HttpPut]
        public async Task<ActionResult<ProfileResponseDto>> Update(
            [FromBody] UpdateProfileDto dto,
            CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return Unauthorized();
            }

            var normalizedName = dto.Name.Trim();
            if (string.IsNullOrWhiteSpace(normalizedName))
            {
                return BadRequest("Name is required.");
            }

            var normalizedSection = dto.Section?.Trim();
            user.DisplayName = normalizedName;
            user.Section = string.IsNullOrWhiteSpace(normalizedSection) ? null : normalizedSection;

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                return BadRequest(string.Join(" ", updateResult.Errors.Select(error => error.Description)));
            }

            var role = await GetPrimaryRoleAsync(user);
            return Ok(ToProfileResponse(user, role));
        }

        [HttpDelete]
        public async Task<IActionResult> Delete(CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user is null)
            {
                return Unauthorized();
            }

            var role = await GetPrimaryRoleAsync(user);
            if (string.Equals(role, AuthConstants.AdminRole, StringComparison.Ordinal))
            {
                return StatusCode(StatusCodes.Status403Forbidden, "Admin accounts cannot be deleted.");
            }

            var assessments = await _db.Assessments
                .Where(x => x.UserId == user.Id)
                .ToListAsync(cancellationToken);

            var assessmentIds = assessments
                .Select(x => x.Id)
                .ToList();

            var images = assessmentIds.Count == 0
                ? new List<AssessmentImage>()
                : await _db.AssessmentImages
                    .Where(x => assessmentIds.Contains(x.AssessmentId))
                    .ToListAsync(cancellationToken);

            foreach (var image in images)
            {
                await _assessmentImageStore.DeleteAsync(image, cancellationToken);
            }

            if (images.Count > 0)
            {
                _db.AssessmentImages.RemoveRange(images);
            }

            if (assessments.Count > 0)
            {
                _db.Assessments.RemoveRange(assessments);
            }

            var deleteResult = await _userManager.DeleteAsync(user);
            if (!deleteResult.Succeeded)
            {
                return BadRequest(string.Join(" ", deleteResult.Errors.Select(error => error.Description)));
            }

            return NoContent();
        }

        private Guid GetCurrentUserId()
        {
            var idClaim = User.FindFirstValue(AuthConstants.LocalUserIdClaimType) ??
                          User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                          User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return Guid.TryParse(idClaim, out var userId) ? userId : Guid.Empty;
        }

        private async Task<string> GetPrimaryRoleAsync(ApplicationUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);
            return roles.FirstOrDefault() ?? AuthConstants.UserRole;
        }

        private static ProfileResponseDto ToProfileResponse(ApplicationUser user, string role)
        {
            return new ProfileResponseDto
            {
                UserId = user.Id.ToString(),
                Email = user.Email ?? user.UserName ?? string.Empty,
                Name = user.DisplayName ?? string.Empty,
                Section = user.Section ?? string.Empty,
                Role = role,
                CanDeleteAccount = !string.Equals(role, AuthConstants.AdminRole, StringComparison.Ordinal)
            };
        }
    }
}
