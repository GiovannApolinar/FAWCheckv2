using System.ComponentModel.DataAnnotations;

namespace maize_drs_backend.DTOs
{
    public class SymptomInputDto
    {
        public bool LeafFeedingDamage { get; set; }

        [Range(0, 2)]
        public int OlderLeavesWithPinholeCount { get; set; }

        [Required]
        public string ShotHoleLeafBand { get; set; } = "none";

        [Required]
        public string ElongatedLesionBand { get; set; } = "none";

        [Required]
        public string HoleBand { get; set; } = "none";

        [Required]
        public string WhorlFurlDestruction { get; set; } = "none";

        public bool PlantDying { get; set; }

        public int? LarvaeCount { get; set; }
    }
}
