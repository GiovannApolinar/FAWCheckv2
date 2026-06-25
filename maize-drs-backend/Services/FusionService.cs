namespace maize_drs_backend.Services
{
    public sealed record InferenceResult(string Label, double Confidence);

    public sealed record FusionResult(
        int FinalScore,
        string FinalConfidence,
        int FinalConfidencePercent,
        List<string> Flags,
        string Explanation);

    public class FusionService
    {
        private const double LowConfidenceThreshold = 60;
        private const double ConflictConfidenceThreshold = 80;
        private const int ScoreConflictThreshold = 3;

        public FusionResult Combine(RuleScoreResult ruleResult, InferenceResult? inference, bool inferenceUnavailable)
        {
            var flags = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            if (ruleResult.UsedFallback)
            {
                flags.Add("rule_fallback_used");
            }

            if (inferenceUnavailable)
            {
                flags.Add("inference_unavailable");
            }

            string? normalizedLabel = null;
            if (inference is not null)
            {
                normalizedLabel = NormalizeLabel(inference.Label);
                if (inference.Confidence < LowConfidenceThreshold)
                {
                    flags.Add("image_low_confidence");
                }

                if (inference.Confidence >= ConflictConfidenceThreshold &&
                    IsRuleConflict(normalizedLabel, ruleResult.Score))
                {
                    flags.Add("image_rule_conflict");
                }
            }

            var flagList = flags.OrderBy(x => x).ToList();
            var finalConfidence = ComputeFinalConfidence(ruleResult, flagList, inferenceUnavailable);
            var finalConfidencePercent = CalculateFinalConfidencePercent(finalConfidence, flagList);
            var explanation = BuildExplanation(
                ruleResult,
                normalizedLabel,
                inference?.Confidence,
                inferenceUnavailable,
                flagList);

            return new FusionResult(ruleResult.Score, finalConfidence, finalConfidencePercent, flagList, explanation);
        }

        public static string NormalizeLabel(string? label)
        {
            if (string.IsNullOrWhiteSpace(label))
            {
                return "damaged";
            }

            var normalized = label.Trim().ToLowerInvariant().Replace(" ", "_");
            if (TryParseScoreLabel(normalized, out var score))
            {
                return $"score_{score}";
            }

            return normalized.Contains("not") ? "not_damaged" : "damaged";
        }

        private static bool IsRuleConflict(string normalizedLabel, int ruleScore)
        {
            if (TryParseScoreLabel(normalizedLabel, out var imageScore))
            {
                return Math.Abs(imageScore - ruleScore) >= ScoreConflictThreshold;
            }

            return (normalizedLabel == "not_damaged" && ruleScore >= 4) ||
                   (normalizedLabel == "damaged" && ruleScore <= 2);
        }

        private static bool TryParseScoreLabel(string? label, out int score)
        {
            score = 0;
            if (string.IsNullOrWhiteSpace(label))
            {
                return false;
            }

            var normalized = label.Trim().ToLowerInvariant().Replace(" ", "_");
            if (!normalized.StartsWith("score_", StringComparison.Ordinal))
            {
                return false;
            }

            return int.TryParse(normalized[6..], out score) && score is >= 1 and <= 9;
        }

        private static string FormatLabel(string? label)
        {
            if (TryParseScoreLabel(label, out var score))
            {
                return $"score {score}";
            }

            return (label ?? "unknown").Trim().Replace("_", " ");
        }

        private static string ComputeFinalConfidence(
            RuleScoreResult ruleResult,
            List<string> flags,
            bool inferenceUnavailable)
        {
            var baseConfidence = ruleResult.UsedFallback ? "medium" : "high";

            // Keep the Prasanna guide as the primary confidence source.
            if (ruleResult.UsedFallback && (inferenceUnavailable || flags.Contains("image_rule_conflict")))
            {
                return "low";
            }

            if (flags.Contains("image_rule_conflict"))
            {
                return "medium";
            }

            return baseConfidence;
        }

        public static int CalculateFinalConfidencePercent(string? finalConfidence, IEnumerable<string>? flags)
        {
            var normalizedFlags = flags?
                .Where(flag => !string.IsNullOrWhiteSpace(flag))
                .ToHashSet(StringComparer.OrdinalIgnoreCase)
                ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var percent = (finalConfidence ?? string.Empty).Trim().ToLowerInvariant() switch
            {
                "high" => 92,
                "medium" => normalizedFlags.Contains("rule_fallback_used") ? 74 : 82,
                "low" => 58,
                "provisional" => 45,
                _ => 70
            };

            if (normalizedFlags.Contains("image_low_confidence"))
            {
                percent -= 6;
            }

            if (normalizedFlags.Contains("image_rule_conflict"))
            {
                percent -= 8;
            }

            if (normalizedFlags.Contains("inference_unavailable"))
            {
                percent -= 4;
            }

            return Math.Clamp(percent, 35, 98);
        }

        private static string BuildExplanation(
            RuleScoreResult ruleResult,
            string? imageLabel,
            double? imageConfidence,
            bool inferenceUnavailable,
            List<string> flags)
        {
            var parts = new List<string>
            {
                $"Final score follows the Prasanna guide: {ruleResult.Score} ({ruleResult.ResponseBand}). {ruleResult.RuleBasis}"
            };

            if (imageLabel is not null && imageConfidence.HasValue)
            {
                parts.Add(
                    $"Advisory image signal: {FormatLabel(imageLabel)} ({imageConfidence.Value:0.##}% confidence). " +
                    "The image model is advisory only while its dataset is still limited.");
            }
            else if (inferenceUnavailable)
            {
                parts.Add("Advisory image signal unavailable; the final score remains based on the Prasanna guide.");
            }

            if (flags.Count > 0)
            {
                parts.Add("Flags: " + string.Join(", ", flags) + ".");
            }

            return string.Join(" ", parts);
        }
    }
}
