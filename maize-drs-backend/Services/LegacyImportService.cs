using System.Text.Json;
using maize_drs_backend.Authentication;
using maize_drs_backend.Data;
using maize_drs_backend.Legacy;
using maize_drs_backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace maize_drs_backend.Services
{
    public class LegacyImportService
    {
        private static readonly string[] LegacyImportFlags = ["legacy_import"];

        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IAssessmentImageStore _assessmentImageStore;
        private readonly ILogger<LegacyImportService> _logger;

        public LegacyImportService(
            ApplicationDbContext db,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IAssessmentImageStore assessmentImageStore,
            ILogger<LegacyImportService> logger)
        {
            _db = db;
            _userManager = userManager;
            _roleManager = roleManager;
            _assessmentImageStore = assessmentImageStore;
            _logger = logger;
        }

        public async Task<LegacyImportResult> ImportAsync(
            IEnumerable<LegacyUserRecord> users,
            IEnumerable<LegacyAssessmentRecord> assessments,
            CancellationToken cancellationToken)
        {
            var result = new LegacyImportResult();
            var cutoverUtc = DateTime.UtcNow;
            var cachedUsersByEmail = new Dictionary<string, ApplicationUser>(StringComparer.Ordinal);

            await EnsureAdminRoleExistsAsync();

            foreach (var user in users)
            {
                try
                {
                    var outcome = await UpsertUserAsync(user, cutoverUtc);
                    cachedUsersByEmail[NormalizeEmailKey(user.Email)] = outcome.User;

                    if (outcome.Created)
                    {
                        result.UsersCreated++;
                    }
                    else if (outcome.Updated)
                    {
                        result.UsersUpdated++;
                    }
                    else
                    {
                        result.UsersSkipped++;
                    }
                }
                catch (Exception ex)
                {
                    result.Failures++;
                    result.Errors.Add($"User {user.Email}: {ex.Message}");
                    _logger.LogError(ex, "Legacy user import failed for {Email}", user.Email);
                }
            }

            foreach (var assessment in assessments)
            {
                try
                {
                    var normalizedEmail = NormalizeEmailKey(assessment.Email);
                    if (string.IsNullOrWhiteSpace(normalizedEmail))
                    {
                        throw new InvalidOperationException("Legacy assessment is missing an email address.");
                    }

                    if (!cachedUsersByEmail.TryGetValue(normalizedEmail, out var user))
                    {
                        user = await _userManager.FindByEmailAsync(assessment.Email.Trim())
                            ?? throw new InvalidOperationException("No imported or existing SQL user matched the legacy assessment email.");
                        cachedUsersByEmail[normalizedEmail] = user;
                    }

                    var imported = await ImportAssessmentAsync(user, assessment, cutoverUtc, cancellationToken);
                    if (imported)
                    {
                        result.AssessmentsImported++;
                    }
                    else
                    {
                        result.AssessmentsSkipped++;
                    }
                }
                catch (Exception ex)
                {
                    result.Failures++;
                    result.Errors.Add($"Assessment {assessment.SourceId}: {ex.Message}");
                    _logger.LogError(ex, "Legacy assessment import failed for {SourceId}", assessment.SourceId);
                }
            }

            return result;
        }

        private async Task EnsureAdminRoleExistsAsync()
        {
            if (await _roleManager.RoleExistsAsync(AuthConstants.AdminRole))
            {
                return;
            }

            var createRole = await _roleManager.CreateAsync(new IdentityRole<Guid>(AuthConstants.AdminRole));
            if (!createRole.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to create admin role: {string.Join(" ", createRole.Errors.Select(error => error.Description))}");
            }
        }

        private async Task<LegacyUserImportOutcome> UpsertUserAsync(LegacyUserRecord record, DateTime fallbackUtc)
        {
            var email = record.Email?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(email))
            {
                throw new InvalidOperationException("Legacy user is missing an email address.");
            }

            if (string.IsNullOrWhiteSpace(record.PasswordHash))
            {
                throw new InvalidOperationException("Legacy user is missing a password hash.");
            }

            var effectiveRegisteredAtUtc = NormalizeUtc(record.RegisteredAtUtc ?? fallbackUtc);
            var user = await _userManager.FindByEmailAsync(email);
            var created = false;
            var updated = false;

            if (user is null)
            {
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    PasswordHash = record.PasswordHash,
                    EmailConfirmed = true,
                    RegisteredAtUtc = effectiveRegisteredAtUtc,
                    IsApproved = true,
                    ApprovedAtUtc = effectiveRegisteredAtUtc
                };

                var createUser = await _userManager.CreateAsync(user);
                if (!createUser.Succeeded)
                {
                    throw new InvalidOperationException(string.Join(" ", createUser.Errors.Select(error => error.Description)));
                }

                created = true;
            }
            else
            {
                if (!string.Equals(user.Email, email, StringComparison.Ordinal))
                {
                    user.Email = email;
                    updated = true;
                }

                if (!string.Equals(user.UserName, email, StringComparison.Ordinal))
                {
                    user.UserName = email;
                    updated = true;
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    updated = true;
                }

                if (user.RegisteredAtUtc == default)
                {
                    user.RegisteredAtUtc = effectiveRegisteredAtUtc;
                    updated = true;
                }

                if (!user.IsApproved)
                {
                    user.IsApproved = true;
                    updated = true;
                }

                if (user.ApprovedAtUtc is null)
                {
                    user.ApprovedAtUtc = effectiveRegisteredAtUtc;
                    updated = true;
                }

                if (string.IsNullOrWhiteSpace(user.PasswordHash))
                {
                    user.PasswordHash = record.PasswordHash;
                    updated = true;
                }

                if (updated)
                {
                    var updateUser = await _userManager.UpdateAsync(user);
                    if (!updateUser.Succeeded)
                    {
                        throw new InvalidOperationException(string.Join(" ", updateUser.Errors.Select(error => error.Description)));
                    }
                }
            }

            if (string.Equals(record.Role?.Trim(), AuthConstants.AdminRole, StringComparison.OrdinalIgnoreCase) &&
                !await _userManager.IsInRoleAsync(user, AuthConstants.AdminRole))
            {
                var addRole = await _userManager.AddToRoleAsync(user, AuthConstants.AdminRole);
                if (!addRole.Succeeded)
                {
                    throw new InvalidOperationException(string.Join(" ", addRole.Errors.Select(error => error.Description)));
                }

                updated = true;
            }

            return new LegacyUserImportOutcome(user, created, updated);
        }

        private async Task<bool> ImportAssessmentAsync(
            ApplicationUser user,
            LegacyAssessmentRecord record,
            DateTime fallbackUtc,
            CancellationToken cancellationToken)
        {
            var sourceId = record.SourceId?.Trim() ?? string.Empty;
            if (string.IsNullOrWhiteSpace(sourceId))
            {
                throw new InvalidOperationException("Legacy assessment is missing a source id.");
            }

            var clientGeneratedId = $"legacy-{sourceId}";
            var exists = await _db.Assessments
                .AsNoTracking()
                .AnyAsync(x => x.UserId == user.Id && x.ClientGeneratedId == clientGeneratedId, cancellationToken);

            if (exists)
            {
                return false;
            }

            var parsed = AssessmentImagePayloadParser.Parse(record.Base64Image ?? string.Empty);
            var assessedAtUtc = NormalizeUtc(record.AssessedAtUtc ?? fallbackUtc);
            var legacyScore = Math.Clamp(record.Score, 1, 9);
            var symptoms = LegacyAssessmentMapper.MapSymptoms(
                record.LeafFeeding,
                record.ShotHoles,
                record.Lesions,
                legacyScore,
                record.LarvaeCount);

            var assessment = new Assessment
            {
                UserId = user.Id,
                ClientGeneratedId = clientGeneratedId,
                AssessedAtUtc = assessedAtUtc,
                SavedAtUtc = DateTime.UtcNow,
                Dap = 0,
                LocationText = null,
                ImageName = string.IsNullOrWhiteSpace(record.ImageName) ? "legacy-upload.jpg" : record.ImageName,
                LeafFeedingDamage = symptoms.LeafFeedingDamage,
                OlderLeavesWithPinholeCount = symptoms.OlderLeavesWithPinholeCount,
                ShotHoleLeafBand = symptoms.ShotHoleLeafBand,
                ElongatedLesionBand = symptoms.ElongatedLesionBand,
                HoleBand = symptoms.HoleBand,
                WhorlFurlDestruction = symptoms.WhorlFurlDestruction,
                PlantDying = symptoms.PlantDying,
                LarvaeCount = symptoms.LarvaeCount,
                RuleScore = legacyScore,
                FinalScore = legacyScore,
                ResponseBand = RuleScoringService.MapResponseBand(legacyScore),
                Explanation = string.IsNullOrWhiteSpace(record.Description)
                    ? "Legacy imported assessment."
                    : record.Description.Trim(),
                FinalConfidence = "provisional",
                FusionFlagsJson = JsonSerializer.Serialize(LegacyImportFlags)
            };

            StoredImageMetadata storedImage;
            try
            {
                storedImage = await _assessmentImageStore.SaveAsync(
                    assessment.Id,
                    assessment.ImageName,
                    parsed.MimeType,
                    parsed.Bytes,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Image storage failed for legacy assessment {SourceId}", sourceId);
                throw new InvalidOperationException("Failed to persist legacy assessment image.");
            }

            assessment.Image = new AssessmentImage
            {
                AssessmentId = assessment.Id,
                OriginalFileName = assessment.ImageName,
                ContentType = parsed.MimeType,
                BlobName = storedImage.BlobName,
                ContentLength = storedImage.ContentLength
            };

            _db.Assessments.Add(assessment);

            try
            {
                await _db.SaveChangesAsync(cancellationToken);
            }
            catch
            {
                await _assessmentImageStore.DeleteAsync(assessment.Image, cancellationToken);
                throw;
            }

            return true;
        }

        private static DateTime NormalizeUtc(DateTime value)
        {
            if (value == default)
            {
                return DateTime.UtcNow;
            }

            return value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
        }

        private string NormalizeEmailKey(string? email)
        {
            return string.IsNullOrWhiteSpace(email)
                ? string.Empty
                : _userManager.NormalizeEmail(email.Trim()) ?? email.Trim().ToUpperInvariant();
        }

        private sealed record LegacyUserImportOutcome(ApplicationUser User, bool Created, bool Updated);
    }

    public class LegacyImportResult
    {
        public int UsersCreated { get; set; }
        public int UsersUpdated { get; set; }
        public int UsersSkipped { get; set; }
        public int AssessmentsImported { get; set; }
        public int AssessmentsSkipped { get; set; }
        public int Failures { get; set; }
        public List<string> Errors { get; } = [];
    }
}
