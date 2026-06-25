using maize_drs_backend.DTOs;

namespace maize_drs_backend.Services
{
    public sealed record RuleScoreResult(int Score, string ResponseBand, string RuleBasis, bool UsedFallback);

    internal sealed record NormalizedSymptoms(
        bool LeafFeedingDamage,
        int OlderLeavesWithPinholeCount,
        string ShotHoleLeafBand,
        string ElongatedLesionBand,
        string HoleBand,
        string WhorlFurlDestruction,
        bool PlantDying,
        int? LarvaeCount);

    public class RuleScoringService
    {
        private static readonly HashSet<string> ShotHoleBands = new(StringComparer.OrdinalIgnoreCase)
        {
            "none", "few_lt5", "several_6_8", "many_8_10", "several_whorl_furl", "most_whorl_furl"
        };

        private static readonly HashSet<string> LesionBands = new(StringComparer.OrdinalIgnoreCase)
        {
            "none", "few_small_upto_1_3cm", "several_large_gt2_5cm", "many_all_sizes"
        };

        private static readonly HashSet<string> HoleBands = new(StringComparer.OrdinalIgnoreCase)
        {
            "none", "few_small_mid", "several_large", "many_mid_large"
        };

        private static readonly HashSet<string> WhorlFurlBands = new(StringComparer.OrdinalIgnoreCase)
        {
            "none", "partial", "almost_total"
        };

        public RuleScoreResult Evaluate(SymptomInputDto symptoms)
        {
            var s = Normalize(symptoms);

            if (s.WhorlFurlDestruction == "almost_total" && s.PlantDying)
            {
                return CreateExact(9, "Whorl/furl leaves almost totally destroyed and plant dying.");
            }

            if (s.ElongatedLesionBand == "many_all_sizes" &&
                s.ShotHoleLeafBand == "most_whorl_furl" &&
                s.HoleBand == "many_mid_large")
            {
                return CreateExact(8, "Many elongated lesions and many mid/large holes on most whorl/furl leaves.");
            }

            if (s.ElongatedLesionBand == "many_all_sizes" &&
                s.ShotHoleLeafBand == "several_whorl_furl" &&
                s.HoleBand == "several_large")
            {
                return CreateExact(7, "Many elongated lesions with several large holes on several whorl/furl leaves.");
            }

            if (s.ShotHoleLeafBand == "several_whorl_furl" &&
                (s.ElongatedLesionBand == "several_large_gt2_5cm" || s.HoleBand == "several_large"))
            {
                return CreateExact(6, "Several large elongated lesions and/or several large holes on whorl/furl leaves.");
            }

            if (s.ShotHoleLeafBand == "many_8_10" &&
                s.ElongatedLesionBand == "several_large_gt2_5cm" &&
                s.HoleBand == "few_small_mid")
            {
                return CreateExact(5, "Elongated lesions on 8-10 leaves plus few small/mid holes from whorl/furl leaves.");
            }

            if (s.ShotHoleLeafBand == "several_6_8" ||
                (s.ElongatedLesionBand == "few_small_upto_1_3cm" && s.HoleBand == "few_small_mid"))
            {
                return CreateExact(4, "Several shot-hole injuries (6-8 leaves) and/or few small elongated lesions with small holes.");
            }

            if (s.ShotHoleLeafBand == "few_lt5" && s.HoleBand == "few_small_mid")
            {
                return CreateExact(3, "Several shot-hole injuries on a few leaves with small circular hole damage.");
            }

            if (s.OlderLeavesWithPinholeCount is 1 or 2 &&
                s.ShotHoleLeafBand == "none" &&
                s.ElongatedLesionBand == "none" &&
                s.HoleBand == "none")
            {
                return CreateExact(2, "Few pinholes observed on 1-2 older leaves.");
            }

            if (!s.LeafFeedingDamage &&
                s.OlderLeavesWithPinholeCount == 0 &&
                s.ShotHoleLeafBand == "none" &&
                s.ElongatedLesionBand == "none" &&
                s.HoleBand == "none" &&
                s.WhorlFurlDestruction == "none" &&
                !s.PlantDying)
            {
                return CreateExact(1, "No visible leaf-feeding damage.");
            }

            var fallbackScore = ComputeFallbackScore(s);
            var fallbackReason =
                "Fallback weighted score used due mixed/non-canonical symptom combination: " +
                $"shot_holes={s.ShotHoleLeafBand}, lesions={s.ElongatedLesionBand}, holes={s.HoleBand}, " +
                $"whorl_furl={s.WhorlFurlDestruction}.";

            return new RuleScoreResult(
                fallbackScore,
                MapResponseBand(fallbackScore),
                fallbackReason,
                true);
        }

        public static string MapResponseBand(int score)
        {
            return score switch
            {
                1 => "Highly resistant",
                2 or 3 => "Resistant",
                4 or 5 => "Partially resistant",
                6 or 7 => "Susceptible",
                _ => "Highly susceptible"
            };
        }

        private static RuleScoreResult CreateExact(int score, string basis)
        {
            return new RuleScoreResult(score, MapResponseBand(score), basis, false);
        }

        private static int ComputeFallbackScore(NormalizedSymptoms s)
        {
            var score = 1;

            if (s.LeafFeedingDamage)
            {
                score = Math.Max(score, 2);
            }

            if (s.OlderLeavesWithPinholeCount > 0)
            {
                score = Math.Max(score, 2);
            }

            score = Math.Max(score, s.ShotHoleLeafBand switch
            {
                "few_lt5" => 3,
                "several_6_8" => 4,
                "many_8_10" => 5,
                "several_whorl_furl" => 6,
                "most_whorl_furl" => 8,
                _ => 1
            });

            score = Math.Max(score, s.ElongatedLesionBand switch
            {
                "few_small_upto_1_3cm" => 4,
                "several_large_gt2_5cm" => 6,
                "many_all_sizes" => 8,
                _ => 1
            });

            score = Math.Max(score, s.HoleBand switch
            {
                "few_small_mid" => 3,
                "several_large" => 6,
                "many_mid_large" => 8,
                _ => 1
            });

            score = Math.Max(score, s.WhorlFurlDestruction switch
            {
                "partial" => 7,
                "almost_total" => 9,
                _ => 1
            });

            if (s.PlantDying)
            {
                score = Math.Max(score, 9);
            }

            return Math.Clamp(score, 1, 9);
        }

        private static NormalizedSymptoms Normalize(SymptomInputDto input)
        {
            var shotHole = NormalizeValue(input.ShotHoleLeafBand, ShotHoleBands, "none");
            var lesion = NormalizeValue(input.ElongatedLesionBand, LesionBands, "none");
            var hole = NormalizeValue(input.HoleBand, HoleBands, "none");
            var whorl = NormalizeValue(input.WhorlFurlDestruction, WhorlFurlBands, "none");

            return new NormalizedSymptoms(
                input.LeafFeedingDamage,
                Math.Clamp(input.OlderLeavesWithPinholeCount, 0, 2),
                shotHole,
                lesion,
                hole,
                whorl,
                input.PlantDying,
                input.LarvaeCount);
        }

        private static string NormalizeValue(string? value, HashSet<string> allowed, string fallback)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return fallback;
            }

            var normalized = value.Trim().ToLowerInvariant();
            return allowed.Contains(normalized) ? normalized : fallback;
        }
    }
}
