using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using maize_drs_backend.Authentication;
using maize_drs_backend.Data;
using maize_drs_backend.DTOs;
using maize_drs_backend.Legacy;
using maize_drs_backend.Models;
using maize_drs_backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace maize_drs_backend.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/assessment")]
    public class AssessmentController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        private readonly RuleScoringService _ruleScoring;
        private readonly FusionService _fusion;
        private readonly IInferenceClient _inferenceClient;
        private readonly IAssessmentImageStore _assessmentImageStore;
        private readonly ILogger<AssessmentController> _logger;

        public AssessmentController(
            ApplicationDbContext db,
            RuleScoringService ruleScoring,
            FusionService fusion,
            IInferenceClient inferenceClient,
            IAssessmentImageStore assessmentImageStore,
            ILogger<AssessmentController> logger)
        {
            _db = db;
            _ruleScoring = ruleScoring;
            _fusion = fusion;
            _inferenceClient = inferenceClient;
            _assessmentImageStore = assessmentImageStore;
            _logger = logger;
        }

        [HttpPost("evaluate-save")]
        public async Task<ActionResult<EvaluateSaveResponseDto>> EvaluateSave(
            [FromBody] EvaluateSaveRequestDto request,
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

            try
            {
                var response = await EvaluateAndPersistAsync(userId, request, cancellationToken);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("evaluate")]
        public async Task<ActionResult<AssessmentEvaluationResponseDto>> Evaluate(
            [FromBody] EvaluateSaveRequestDto request,
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

            try
            {
                var evaluation = await EvaluateAsync(request, cancellationToken);
                return Ok(ToEvaluationResponse(evaluation));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("submit")]
        public async Task<ActionResult<EvaluateSaveResponseDto>> SubmitLegacy(
            [FromBody] AssessmentDto dto,
            CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            try
            {
                var request = LegacyAssessmentMapper.ToEvaluateSaveRequest(dto);
                var response = await EvaluateAndPersistAsync(userId, request, cancellationToken);
                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Offline queued sync is disabled until the browser queue flow is fixed.
        // [HttpPost("sync")]
        // public async Task<ActionResult<SyncAssessmentsResponseDto>> Sync(
        //     [FromBody] SyncAssessmentsRequestDto request,
        //     CancellationToken cancellationToken)
        // {
        //     if (request.Records.Count == 0)
        //     {
        //         return BadRequest("No records provided.");
        //     }
        //
        //     var userId = GetCurrentUserId();
        //     if (userId == Guid.Empty)
        //     {
        //         return Unauthorized();
        //     }
        //
        //     var response = new SyncAssessmentsResponseDto
        //     {
        //         TotalReceived = request.Records.Count
        //     };
        //
        //     foreach (var record in request.Records.Take(200))
        //     {
        //         try
        //         {
        //             var saved = await EvaluateAndPersistAsync(userId, record, cancellationToken);
        //             response.Results.Add(saved);
        //             response.Saved++;
        //         }
        //         catch (Exception ex)
        //         {
        //             response.Failed++;
        //             response.Errors.Add(ex.Message);
        //             _logger.LogWarning(ex, "Failed to sync record {ClientGeneratedId}", record.ClientGeneratedId);
        //         }
        //     }
        //
        //     return Ok(response);
        // }

        [HttpGet]
        public async Task<ActionResult<PagedAssessmentsResponseDto>> List(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] DateTime? fromUtc = null,
            [FromQuery] DateTime? toUtc = null,
            [FromQuery] int? minScore = null,
            [FromQuery] int? maxScore = null,
            [FromQuery] string? search = null,
            CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _db.Assessments.AsNoTracking().Where(x => x.UserId == userId);
            query = ApplyFilters(query, fromUtc, toUtc, minScore, maxScore, search);

            var total = await query.CountAsync(cancellationToken);
            var records = await query
                .OrderByDescending(x => x.AssessedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            var items = records
                .Select(x => new AssessmentListItemDto
                {
                    RecordId = x.Id.ToString(),
                    AssessedAtUtc = x.AssessedAtUtc.ToString("o"),
                    Dap = x.Dap,
                    LocationText = x.LocationText,
                    FinalScore = x.FinalScore,
                    ResponseBand = x.ResponseBand,
                    FinalConfidence = x.FinalConfidence,
                    FinalConfidencePercent = FusionService.CalculateFinalConfidencePercent(
                        x.FinalConfidence,
                        ParseFlags(x.FusionFlagsJson)),
                    ImageName = x.ImageName,
                    Explanation = x.Explanation
                })
                .ToList();

            return Ok(new PagedAssessmentsResponseDto
            {
                Page = page,
                PageSize = pageSize,
                Total = total,
                Items = items
            });
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<AssessmentDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var record = await _db.Assessments.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);

            if (record is null)
            {
                return NotFound();
            }

            var imageUrl = Url.Action(nameof(GetImage), "Assessment", new { id = record.Id }, Request.Scheme);

            return Ok(ToDetail(record, imageUrl));
        }

        [HttpGet("{id:guid}/image")]
        public async Task<IActionResult> GetImage(Guid id, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var image = await _db.AssessmentImages
                .AsNoTracking()
                .Where(x => x.AssessmentId == id && x.Assessment != null && x.Assessment.UserId == userId)
                .FirstOrDefaultAsync(cancellationToken);

            if (image is null)
            {
                return NotFound();
            }

            var bytes = await _assessmentImageStore.ReadAsync(image, cancellationToken);
            if (bytes is null)
            {
                return NotFound();
            }

            return File(bytes, image.ContentType);
        }

        [HttpPut("{id:guid}")]
        public async Task<ActionResult<EvaluateSaveResponseDto>> Update(
            Guid id,
            [FromBody] EvaluateSaveRequestDto request,
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

            var record = await _db.Assessments
                .Include(x => x.Image)
                .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);

            if (record is null)
            {
                return NotFound();
            }

            request.ClientGeneratedId = record.ClientGeneratedId;
            request.AssessedAtUtc = record.AssessedAtUtc;

            try
            {
                var evaluation = await EvaluateAsync(request, cancellationToken);
                var previousImage = CloneImage(record.Image);

                StoredImageMetadata storedImage;
                try
                {
                    storedImage = await _assessmentImageStore.SaveAsync(
                        record.Id,
                        request.ImageName,
                        evaluation.Image.MimeType,
                        evaluation.Image.Bytes,
                        cancellationToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Image storage failed while updating assessment {AssessmentId}", record.Id);
                    throw new InvalidOperationException("Failed to persist assessment image.");
                }

                ApplyEvaluationToAssessment(record, request, evaluation);

                record.Image ??= new AssessmentImage
                {
                    AssessmentId = record.Id
                };

                record.Image.OriginalFileName = request.ImageName;
                record.Image.ContentType = evaluation.Image.MimeType;
                record.Image.BlobName = storedImage.BlobName;
                record.Image.ContentLength = storedImage.ContentLength;

                try
                {
                    await _db.SaveChangesAsync(cancellationToken);
                }
                catch
                {
                    await _assessmentImageStore.DeleteAsync(record.Image, cancellationToken);
                    throw;
                }

                if (previousImage is not null &&
                    !string.Equals(previousImage.BlobName, record.Image.BlobName, StringComparison.Ordinal))
                {
                    try
                    {
                        await _assessmentImageStore.DeleteAsync(previousImage, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete superseded image for assessment {AssessmentId}", record.Id);
                    }
                }

                return Ok(ToResponse(record));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var record = await _db.Assessments.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, cancellationToken);
            if (record is null)
            {
                return NotFound();
            }

            var image = await _db.AssessmentImages.FirstOrDefaultAsync(x => x.AssessmentId == id, cancellationToken);
            if (image is not null)
            {
                await _assessmentImageStore.DeleteAsync(image, cancellationToken);
                _db.AssessmentImages.Remove(image);
            }

            _db.Assessments.Remove(record);
            await _db.SaveChangesAsync(cancellationToken);

            return NoContent();
        }

        [HttpGet("export/csv")]
        public async Task<IActionResult> ExportCsv(
            [FromQuery] DateTime? fromUtc = null,
            [FromQuery] DateTime? toUtc = null,
            [FromQuery] int? minScore = null,
            [FromQuery] int? maxScore = null,
            [FromQuery] string? search = null,
            CancellationToken cancellationToken = default)
        {
            var userId = GetCurrentUserId();
            if (userId == Guid.Empty)
            {
                return Unauthorized();
            }

            var query = _db.Assessments.AsNoTracking().Where(x => x.UserId == userId);
            query = ApplyFilters(query, fromUtc, toUtc, minScore, maxScore, search);

            var rows = await query
                .OrderByDescending(x => x.AssessedAtUtc)
                .ToListAsync(cancellationToken);

            var sb = new StringBuilder();
            sb.AppendLine("AssessedAtUtc,Dap,Location,FinalScore,ResponseBand,FinalConfidence");
            foreach (var row in rows)
            {
                sb.AppendLine(string.Join(",",
                    EscapeCsv(row.AssessedAtUtc.ToString("o")),
                    EscapeCsv(row.Dap.ToString()),
                    EscapeCsv(row.LocationText ?? string.Empty),
                    EscapeCsv(row.FinalScore.ToString()),
                    EscapeCsv(row.ResponseBand),
                    EscapeCsv(row.FinalConfidence)));
            }

            var bytes = Encoding.UTF8.GetBytes(sb.ToString());
            var fileName = $"fawcheck-records-{DateTime.UtcNow:yyyyMMdd-HHmmss}.csv";
            return File(bytes, "text/csv", fileName);
        }

        private async Task<EvaluateSaveResponseDto> EvaluateAndPersistAsync(
            Guid userId,
            EvaluateSaveRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureClientGeneratedId(request);

            var existing = await _db.Assessments.AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.UserId == userId && x.ClientGeneratedId == request.ClientGeneratedId,
                    cancellationToken);

            if (existing is not null)
            {
                return ToResponse(existing);
            }

            var evaluation = await EvaluateAsync(request, cancellationToken);

            var assessment = new Assessment
            {
                UserId = userId
            };

            ApplyEvaluationToAssessment(assessment, request, evaluation);

            StoredImageMetadata storedImage;
            try
            {
                storedImage = await _assessmentImageStore.SaveAsync(
                    assessment.Id,
                    request.ImageName,
                    evaluation.Image.MimeType,
                    evaluation.Image.Bytes,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Image storage failed for assessment {AssessmentId}", assessment.Id);
                throw new InvalidOperationException("Failed to persist assessment image.");
            }

            assessment.Image = new AssessmentImage
            {
                AssessmentId = assessment.Id,
                OriginalFileName = request.ImageName,
                ContentType = evaluation.Image.MimeType,
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

            return ToResponse(assessment);
        }

        private async Task<EvaluatedAssessment> EvaluateAsync(
            EvaluateSaveRequestDto request,
            CancellationToken cancellationToken)
        {
            EnsureClientGeneratedId(request);

            var parsed = AssessmentImagePayloadParser.Parse(request.ImageBase64);
            AssessmentImagePayloadParser.ValidateForUpload(parsed.Bytes, parsed.MimeType);

            var normalizedSymptoms = request.Symptoms ?? new SymptomInputDto();
            var ruleResult = _ruleScoring.Evaluate(normalizedSymptoms);

            var inferenceUnavailable = false;
            InferenceResult? inference = null;
            try
            {
                inference = await _inferenceClient.PredictAsync(
                    parsed.Bytes,
                    request.ImageName,
                    parsed.MimeType,
                    cancellationToken);

                inferenceUnavailable = inference is null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Inference request failed for {ImageName}", request.ImageName);
                inferenceUnavailable = true;
            }

            var fusionResult = _fusion.Combine(ruleResult, inference, inferenceUnavailable);
            var assessedAt = request.AssessedAtUtc == default
                ? DateTime.UtcNow
                : request.AssessedAtUtc.Kind == DateTimeKind.Utc
                    ? request.AssessedAtUtc
                    : request.AssessedAtUtc.ToUniversalTime();

            return new EvaluatedAssessment(
                assessedAt,
                normalizedSymptoms,
                parsed,
                ruleResult,
                inference,
                fusionResult);
        }

        private IQueryable<Assessment> ApplyFilters(
            IQueryable<Assessment> query,
            DateTime? fromUtc,
            DateTime? toUtc,
            int? minScore,
            int? maxScore,
            string? search)
        {
            if (fromUtc.HasValue)
            {
                var value = fromUtc.Value.Kind == DateTimeKind.Utc ? fromUtc.Value : fromUtc.Value.ToUniversalTime();
                query = query.Where(x => x.AssessedAtUtc >= value);
            }

            if (toUtc.HasValue)
            {
                var value = toUtc.Value.Kind == DateTimeKind.Utc ? toUtc.Value : toUtc.Value.ToUniversalTime();
                query = query.Where(x => x.AssessedAtUtc <= value);
            }

            if (minScore.HasValue)
            {
                query = query.Where(x => x.FinalScore >= minScore.Value);
            }

            if (maxScore.HasValue)
            {
                query = query.Where(x => x.FinalScore <= maxScore.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(x =>
                    (x.LocationText ?? string.Empty).Contains(term) ||
                    x.ImageName.Contains(term) ||
                    x.Explanation.Contains(term));
            }

            return query;
        }

        private static string EscapeCsv(string value)
        {
            var normalized = value.Replace("\"", "\"\"");
            return $"\"{normalized}\"";
        }

        private Guid GetCurrentUserId()
        {
            var idClaim = User.FindFirstValue(AuthConstants.LocalUserIdClaimType) ??
                          User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                          User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return Guid.TryParse(idClaim, out var userId) ? userId : Guid.Empty;
        }

        private static EvaluateSaveResponseDto ToResponse(Assessment assessment)
        {
            var flags = ParseFlags(assessment.FusionFlagsJson);

            return new EvaluateSaveResponseDto
            {
                RecordId = assessment.Id.ToString(),
                RuleScore = assessment.RuleScore,
                FinalScore = assessment.FinalScore,
                ResponseBand = assessment.ResponseBand,
                ImagePrediction = assessment.ImagePredictionLabel is null
                    ? null
                    : new ImagePredictionDto
                    {
                        Label = assessment.ImagePredictionLabel,
                        Confidence = assessment.ImagePredictionConfidence ?? 0
                    },
                FinalConfidence = assessment.FinalConfidence,
                FinalConfidencePercent = FusionService.CalculateFinalConfidencePercent(assessment.FinalConfidence, flags),
                Flags = flags,
                Explanation = assessment.Explanation,
                SavedAtUtc = assessment.SavedAtUtc.ToString("o")
            };
        }

        private static void ApplyEvaluationToAssessment(
            Assessment assessment,
            EvaluateSaveRequestDto request,
            EvaluatedAssessment evaluation)
        {
            assessment.ClientGeneratedId = request.ClientGeneratedId;
            assessment.AssessedAtUtc = evaluation.AssessedAtUtc;
            assessment.SavedAtUtc = DateTime.UtcNow;
            assessment.Dap = request.Dap;
            assessment.LocationText = request.LocationText;
            assessment.ImageName = request.ImageName;
            assessment.LeafFeedingDamage = evaluation.Symptoms.LeafFeedingDamage;
            assessment.OlderLeavesWithPinholeCount = Math.Clamp(evaluation.Symptoms.OlderLeavesWithPinholeCount, 0, 2);
            assessment.ShotHoleLeafBand = evaluation.Symptoms.ShotHoleLeafBand;
            assessment.ElongatedLesionBand = evaluation.Symptoms.ElongatedLesionBand;
            assessment.HoleBand = evaluation.Symptoms.HoleBand;
            assessment.WhorlFurlDestruction = evaluation.Symptoms.WhorlFurlDestruction;
            assessment.PlantDying = evaluation.Symptoms.PlantDying;
            assessment.LarvaeCount = evaluation.Symptoms.LarvaeCount;
            assessment.RuleScore = evaluation.RuleResult.Score;
            assessment.FinalScore = evaluation.FusionResult.FinalScore;
            assessment.ResponseBand = evaluation.RuleResult.ResponseBand;
            assessment.Explanation = evaluation.FusionResult.Explanation;
            assessment.ImagePredictionLabel = evaluation.Inference?.Label;
            assessment.ImagePredictionConfidence = evaluation.Inference?.Confidence;
            assessment.FinalConfidence = evaluation.FusionResult.FinalConfidence;
            assessment.FusionFlagsJson = JsonSerializer.Serialize(evaluation.FusionResult.Flags);
        }

        private static AssessmentImage? CloneImage(AssessmentImage? image)
        {
            if (image is null)
            {
                return null;
            }

            return new AssessmentImage
            {
                AssessmentId = image.AssessmentId,
                OriginalFileName = image.OriginalFileName,
                ContentType = image.ContentType,
                BlobName = image.BlobName,
                ContentLength = image.ContentLength
            };
        }

        private static AssessmentDetailDto ToDetail(Assessment assessment, string? imageUrl)
        {
            var flags = ParseFlags(assessment.FusionFlagsJson);

            return new AssessmentDetailDto
            {
                RecordId = assessment.Id.ToString(),
                ClientGeneratedId = assessment.ClientGeneratedId,
                AssessedAtUtc = assessment.AssessedAtUtc.ToString("o"),
                SavedAtUtc = assessment.SavedAtUtc.ToString("o"),
                Dap = assessment.Dap,
                LocationText = assessment.LocationText,
                ImageName = assessment.ImageName,
                ImageUrl = imageUrl,
                RuleScore = assessment.RuleScore,
                FinalScore = assessment.FinalScore,
                ResponseBand = assessment.ResponseBand,
                ImagePrediction = assessment.ImagePredictionLabel is null
                    ? null
                    : new ImagePredictionDto
                    {
                        Label = assessment.ImagePredictionLabel,
                        Confidence = assessment.ImagePredictionConfidence ?? 0
                    },
                FinalConfidence = assessment.FinalConfidence,
                FinalConfidencePercent = FusionService.CalculateFinalConfidencePercent(assessment.FinalConfidence, flags),
                Flags = flags,
                Explanation = assessment.Explanation,
                Symptoms = new SymptomInputDto
                {
                    LeafFeedingDamage = assessment.LeafFeedingDamage,
                    OlderLeavesWithPinholeCount = assessment.OlderLeavesWithPinholeCount,
                    ShotHoleLeafBand = assessment.ShotHoleLeafBand,
                    ElongatedLesionBand = assessment.ElongatedLesionBand,
                    HoleBand = assessment.HoleBand,
                    WhorlFurlDestruction = assessment.WhorlFurlDestruction,
                    PlantDying = assessment.PlantDying,
                    LarvaeCount = assessment.LarvaeCount
                }
            };
        }

        private static AssessmentEvaluationResponseDto ToEvaluationResponse(EvaluatedAssessment evaluation)
        {
            return new AssessmentEvaluationResponseDto
            {
                RuleScore = evaluation.RuleResult.Score,
                FinalScore = evaluation.FusionResult.FinalScore,
                ResponseBand = evaluation.RuleResult.ResponseBand,
                ImagePrediction = evaluation.Inference is null
                    ? null
                    : new ImagePredictionDto
                    {
                        Label = evaluation.Inference.Label,
                        Confidence = evaluation.Inference.Confidence
                    },
                FinalConfidence = evaluation.FusionResult.FinalConfidence,
                FinalConfidencePercent = evaluation.FusionResult.FinalConfidencePercent,
                Flags = evaluation.FusionResult.Flags,
                Explanation = evaluation.FusionResult.Explanation
            };
        }

        private static List<string> ParseFlags(string flagsJson)
        {
            if (string.IsNullOrWhiteSpace(flagsJson))
            {
                return new List<string>();
            }

            try
            {
                return JsonSerializer.Deserialize<List<string>>(flagsJson) ?? new List<string>();
            }
            catch
            {
                return new List<string>();
            }
        }

        private static void EnsureClientGeneratedId(EvaluateSaveRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.ClientGeneratedId))
            {
                request.ClientGeneratedId = Guid.NewGuid().ToString("N");
            }
        }

        private sealed record EvaluatedAssessment(
            DateTime AssessedAtUtc,
            SymptomInputDto Symptoms,
            ParsedImagePayload Image,
            RuleScoreResult RuleResult,
            InferenceResult? Inference,
            FusionResult FusionResult);
    }
}
