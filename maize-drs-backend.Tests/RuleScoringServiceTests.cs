using maize_drs_backend.DTOs;
using maize_drs_backend.Services;
using Xunit;

namespace maize_drs_backend.Tests;

public class RuleScoringServiceTests
{
    private readonly RuleScoringService _service = new();

    [Theory]
    [InlineData("none", "none", "none", "none", false, false, 0, 1)]
    [InlineData("none", "none", "none", "none", false, false, 2, 2)]
    [InlineData("few_lt5", "none", "few_small_mid", "none", true, false, 0, 3)]
    [InlineData("several_6_8", "none", "none", "none", true, false, 0, 4)]
    [InlineData("many_8_10", "several_large_gt2_5cm", "few_small_mid", "none", true, false, 0, 5)]
    [InlineData("several_whorl_furl", "several_large_gt2_5cm", "none", "partial", true, false, 0, 6)]
    [InlineData("several_whorl_furl", "many_all_sizes", "several_large", "partial", true, false, 0, 7)]
    [InlineData("most_whorl_furl", "many_all_sizes", "many_mid_large", "partial", true, false, 0, 8)]
    [InlineData("most_whorl_furl", "many_all_sizes", "many_mid_large", "almost_total", true, true, 0, 9)]
    public void Evaluate_ReturnsExpectedCanonicalScore(
        string shotHoles,
        string lesions,
        string holes,
        string whorlFurl,
        bool leafFeeding,
        bool plantDying,
        int pinholes,
        int expectedScore)
    {
        var input = new SymptomInputDto
        {
            LeafFeedingDamage = leafFeeding,
            OlderLeavesWithPinholeCount = pinholes,
            ShotHoleLeafBand = shotHoles,
            ElongatedLesionBand = lesions,
            HoleBand = holes,
            WhorlFurlDestruction = whorlFurl,
            PlantDying = plantDying
        };

        var result = _service.Evaluate(input);

        Assert.Equal(expectedScore, result.Score);
    }

    [Fact]
    public void Evaluate_UsesFallbackOnMixedNonCanonicalInput()
    {
        var input = new SymptomInputDto
        {
            LeafFeedingDamage = true,
            OlderLeavesWithPinholeCount = 0,
            ShotHoleLeafBand = "few_lt5",
            ElongatedLesionBand = "none",
            HoleBand = "none",
            WhorlFurlDestruction = "none",
            PlantDying = false
        };

        var result = _service.Evaluate(input);

        Assert.True(result.UsedFallback);
        Assert.Contains("Fallback weighted score", result.RuleBasis);
        Assert.InRange(result.Score, 1, 9);
    }

    [Theory]
    [InlineData(1, "Highly resistant")]
    [InlineData(2, "Resistant")]
    [InlineData(3, "Resistant")]
    [InlineData(4, "Partially resistant")]
    [InlineData(5, "Partially resistant")]
    [InlineData(6, "Susceptible")]
    [InlineData(7, "Susceptible")]
    [InlineData(8, "Highly susceptible")]
    [InlineData(9, "Highly susceptible")]
    public void MapResponseBand_ReturnsExpectedBand(int score, string expectedBand)
    {
        var band = RuleScoringService.MapResponseBand(score);
        Assert.Equal(expectedBand, band);
    }
}
