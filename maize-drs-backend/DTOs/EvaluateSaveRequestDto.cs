using System.ComponentModel.DataAnnotations;

namespace maize_drs_backend.DTOs
{
    public class EvaluateSaveRequestDto
    {
        [Required]
        public string ClientGeneratedId { get; set; } = Guid.NewGuid().ToString("N");

        public DateTime AssessedAtUtc { get; set; } = DateTime.UtcNow;

        [Range(0, 365)]
        public int Dap { get; set; }

        public string? LocationText { get; set; }

        [Required]
        public string ImageName { get; set; } = string.Empty;

        [Required]
        public string ImageBase64 { get; set; } = string.Empty;

        [Required]
        public SymptomInputDto Symptoms { get; set; } = new();
    }
}
