using System.ComponentModel.DataAnnotations;

namespace maize_drs_backend.DTOs
{
    public class UpdateProfileDto
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(120)]
        public string? Section { get; set; }
    }
}
