using maize_drs_backend.DTOs;
using maize_drs_backend.Models;
using maize_drs_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace maize_drs_backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        // private const string PendingApprovalStatus = "pending_approval";
        // private const string PendingApprovalMessage = "Your account is awaiting admin approval.";

        private readonly UserManager<ApplicationUser> _userManager;
        private readonly JwtService _jwtService;

        public AuthController(UserManager<ApplicationUser> userManager, JwtService jwtService)
        {
            _userManager = userManager;
            _jwtService = jwtService;
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var email = dto.Email.Trim();
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser is not null)
            {
                return BadRequest("Email already in use.");
            }

            var user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                RegisteredAtUtc = DateTime.UtcNow,
                IsApproved = true, // removed admin approval requirement for testing purposes
                ApprovedAtUtc = DateTime.UtcNow,
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                return BadRequest(string.Join(" ", createResult.Errors.Select(error => error.Description)));
            }

            return Ok(new AuthenticationResponseDto
            {
                Email = user.Email ?? email,
                Status = "success"
            });
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid)
            {
                return ValidationProblem(ModelState);
            }

            var email = dto.Email.Trim();
            var user = await _userManager.FindByEmailAsync(email);
            if (user is null)
            {
                return Unauthorized("Invalid credentials");
            }

            var isValidPassword = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isValidPassword)
            {
                return Unauthorized("Invalid credentials");
            }

            // if (!user.IsApproved)
            // {
            //     return StatusCode(StatusCodes.Status403Forbidden, CreatePendingApprovalResponse(user.Email ?? email));
            // }

            var token = await _jwtService.CreateJwtTokenAsync(user);
            var role = await _jwtService.GetPrimaryRoleAsync(user);
            return Ok(new AuthenticationResponseDto
            {
                Token = token,
                Email = user.Email ?? email,
                Role = role
            });
        }

        // private static PendingAuthResponseDto CreatePendingApprovalResponse(string email)
        // {
        //     return new PendingAuthResponseDto
        //     {
        //         Email = email,
        //         Status = PendingApprovalStatus,
        //         Message = PendingApprovalMessage
        //     };
        // }
    }
}
