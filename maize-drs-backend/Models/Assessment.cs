using System.ComponentModel.DataAnnotations;

namespace maize_drs_backend.Models
{
    public class Assessment
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid UserId { get; set; }

        public ApplicationUser? User { get; set; }

        [Required]
        [MaxLength(80)]
        public string ClientGeneratedId { get; set; } = string.Empty;

        public DateTime AssessedAtUtc { get; set; }

        public DateTime SavedAtUtc { get; set; } = DateTime.UtcNow;

        public int Dap { get; set; }

        [MaxLength(200)]
        public string? LocationText { get; set; }

        [Required]
        [MaxLength(260)]
        public string ImageName { get; set; } = string.Empty;

        public AssessmentImage? Image { get; set; }

        public bool LeafFeedingDamage { get; set; }

        public int OlderLeavesWithPinholeCount { get; set; }

        [Required]
        [MaxLength(40)]
        public string ShotHoleLeafBand { get; set; } = "none";

        [Required]
        [MaxLength(40)]
        public string ElongatedLesionBand { get; set; } = "none";

        [Required]
        [MaxLength(40)]
        public string HoleBand { get; set; } = "none";

        [Required]
        [MaxLength(40)]
        public string WhorlFurlDestruction { get; set; } = "none";

        public bool PlantDying { get; set; }

        public int? LarvaeCount { get; set; }

        public int RuleScore { get; set; }

        public int FinalScore { get; set; }

        [Required]
        [MaxLength(40)]
        public string ResponseBand { get; set; } = string.Empty;

        [Required]
        [MaxLength(2000)]
        public string Explanation { get; set; } = string.Empty;

        [MaxLength(40)]
        public string? ImagePredictionLabel { get; set; }

        public double? ImagePredictionConfidence { get; set; }

        [Required]
        [MaxLength(20)]
        public string FinalConfidence { get; set; } = "low";

        [Required]
        [MaxLength(2000)]
        public string FusionFlagsJson { get; set; } = "[]";
    }
}
