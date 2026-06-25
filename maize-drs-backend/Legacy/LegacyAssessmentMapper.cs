using maize_drs_backend.DTOs;

namespace maize_drs_backend.Legacy
{
    public static class LegacyAssessmentMapper
    {
        public static EvaluateSaveRequestDto ToEvaluateSaveRequest(
            AssessmentDto dto,
            DateTime? assessedAtUtc = null,
            string? clientGeneratedId = null)
        {
            return new EvaluateSaveRequestDto
            {
                ClientGeneratedId = string.IsNullOrWhiteSpace(clientGeneratedId)
                    ? Guid.NewGuid().ToString("N")
                    : clientGeneratedId,
                AssessedAtUtc = NormalizeUtc(assessedAtUtc ?? DateTime.UtcNow),
                Dap = 0,
                LocationText = null,
                ImageName = string.IsNullOrWhiteSpace(dto.ImageName) ? "legacy-upload.jpg" : dto.ImageName,
                ImageBase64 = dto.Base64Image ?? string.Empty,
                Symptoms = MapSymptoms(dto.LeafFeeding, dto.ShotHoles, dto.Lesions, dto.Score, dto.LarvaeCount)
            };
        }

        public static SymptomInputDto MapSymptoms(
            string? leafFeeding,
            string? shotHoles,
            string? lesions,
            int score,
            int? larvaeCount)
        {
            var shotBand = shotHoles?.Trim().ToLowerInvariant() switch
            {
                "none" => "none",
                "1-2" => "few_lt5",
                "3-5" => "few_lt5",
                "6-8" => "several_6_8",
                "more than 8" => "many_8_10",
                _ => "none"
            };

            var lesionBand = lesions?.Trim().ToLowerInvariant() switch
            {
                "few" => "few_small_upto_1_3cm",
                "several" => "several_large_gt2_5cm",
                "too many" => "many_all_sizes",
                _ => "none"
            };

            var holeBand = shotBand switch
            {
                "few_lt5" => "few_small_mid",
                "several_6_8" => "few_small_mid",
                "many_8_10" => "few_small_mid",
                _ => "none"
            };

            var whorlFurlDestruction = score >= 9
                ? "almost_total"
                : score >= 6
                    ? "partial"
                    : "none";

            return new SymptomInputDto
            {
                LeafFeedingDamage = string.Equals(leafFeeding, "yes", StringComparison.OrdinalIgnoreCase),
                OlderLeavesWithPinholeCount = 0,
                ShotHoleLeafBand = shotBand,
                ElongatedLesionBand = lesionBand,
                HoleBand = holeBand,
                WhorlFurlDestruction = whorlFurlDestruction,
                PlantDying = score >= 9,
                LarvaeCount = larvaeCount
            };
        }

        private static DateTime NormalizeUtc(DateTime value)
        {
            if (value == default)
            {
                return DateTime.UtcNow;
            }

            return value.Kind == DateTimeKind.Utc ? value : value.ToUniversalTime();
        }
    }
}
