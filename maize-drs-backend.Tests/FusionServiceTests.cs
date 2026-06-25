using maize_drs_backend.Services;
using Xunit;

namespace maize_drs_backend.Tests;

public class FusionServiceTests
{
    private readonly FusionService _service = new();

    [Fact]
    public void Combine_KeepsHighConfidenceWhenRuleIsExactAndInferenceUnavailable()
    {
        var rule = new RuleScoreResult(4, "Partially resistant", "Canonical Prasanna match.", false);

        var result = _service.Combine(rule, null, inferenceUnavailable: true);

        Assert.Equal(4, result.FinalScore);
        Assert.Equal("high", result.FinalConfidence);
        Assert.Equal(88, result.FinalConfidencePercent);
        Assert.Contains("inference_unavailable", result.Flags);
        Assert.Contains("Prasanna guide", result.Explanation);
    }

    [Fact]
    public void Combine_DropsToLowWhenFallbackRuleHasNoInferenceSupport()
    {
        var rule = new RuleScoreResult(5, "Partially resistant", "Fallback weighted score.", true);

        var result = _service.Combine(rule, null, inferenceUnavailable: true);

        Assert.Equal("low", result.FinalConfidence);
        Assert.Equal(54, result.FinalConfidencePercent);
        Assert.Contains("rule_fallback_used", result.Flags);
        Assert.Contains("inference_unavailable", result.Flags);
    }

    [Fact]
    public void Combine_DoesNotEscalateLowConfidenceImageConflictAgainstExactRule()
    {
        var rule = new RuleScoreResult(1, "Highly resistant", "No visible damage.", false);
        var inference = new InferenceResult("damaged", 52);

        var result = _service.Combine(rule, inference, inferenceUnavailable: false);

        Assert.Equal("high", result.FinalConfidence);
        Assert.Equal(86, result.FinalConfidencePercent);
        Assert.Contains("image_low_confidence", result.Flags);
        Assert.DoesNotContain("image_rule_conflict", result.Flags);
    }

    [Fact]
    public void Combine_DowngradesToMediumWhenStrongImageSignalConflictsWithExactRule()
    {
        var rule = new RuleScoreResult(1, "Highly resistant", "No visible damage.", false);
        var inference = new InferenceResult("damaged", 91);

        var result = _service.Combine(rule, inference, inferenceUnavailable: false);

        Assert.Equal("medium", result.FinalConfidence);
        Assert.Equal(74, result.FinalConfidencePercent);
        Assert.Contains("image_rule_conflict", result.Flags);
        Assert.Contains("advisory only", result.Explanation);
    }

    [Fact]
    public void Combine_DowngradesToMediumWhenStrongScorePredictionConflictsWithRule()
    {
        var rule = new RuleScoreResult(2, "Resistant", "Few pinholes observed.", false);
        var inference = new InferenceResult("score_7", 88);

        var result = _service.Combine(rule, inference, inferenceUnavailable: false);

        Assert.Equal("medium", result.FinalConfidence);
        Assert.Equal(74, result.FinalConfidencePercent);
        Assert.Contains("image_rule_conflict", result.Flags);
        Assert.Contains("score 7", result.Explanation);
    }

    [Fact]
    public void Combine_KeepsHighConfidenceWhenScorePredictionIsCloseToRule()
    {
        var rule = new RuleScoreResult(5, "Partially resistant", "Canonical Prasanna match.", false);
        var inference = new InferenceResult("score_6", 90);

        var result = _service.Combine(rule, inference, inferenceUnavailable: false);

        Assert.Equal("high", result.FinalConfidence);
        Assert.Equal(92, result.FinalConfidencePercent);
        Assert.DoesNotContain("image_rule_conflict", result.Flags);
    }
}
