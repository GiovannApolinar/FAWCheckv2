namespace maize_drs_backend.DTOs
{
    public class AssessmentDto
    {
        public string? ImageName { get; set; }
        public string? Base64Image { get; set; }
        public string? CropStage { get; set; }
        public string? LeafFeeding { get; set; }
        public string? ShotHoles { get; set; }
        public string? Lesions { get; set; }
        public int LarvaeCount { get; set; }
        public int Score { get; set; }
        public string? Description { get; set; }
    }
}
