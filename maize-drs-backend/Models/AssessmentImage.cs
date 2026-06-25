using System.ComponentModel.DataAnnotations;

namespace maize_drs_backend.Models
{
    public class AssessmentImage
    {
        [Key]
        public Guid AssessmentId { get; set; }

        [Required]
        [MaxLength(260)]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } = "image/jpeg";

        [Required]
        [MaxLength(512)]
        public string BlobName { get; set; } = string.Empty;

        public long ContentLength { get; set; }

        public Assessment? Assessment { get; set; }
    }
}
