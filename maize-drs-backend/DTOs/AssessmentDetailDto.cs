namespace maize_drs_backend.DTOs
{
    public class AssessmentDetailDto
    {
        public string RecordId { get; set; } = string.Empty;
        public string ClientGeneratedId { get; set; } = string.Empty;
        public string AssessedAtUtc { get; set; } = string.Empty;
        public string SavedAtUtc { get; set; } = string.Empty;
        public int Dap { get; set; }
        public string? LocationText { get; set; }
        public string ImageName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int RuleScore { get; set; }
        public int FinalScore { get; set; }
        public string ResponseBand { get; set; } = string.Empty;
        public ImagePredictionDto? ImagePrediction { get; set; }
        public string FinalConfidence { get; set; } = string.Empty;
        public int FinalConfidencePercent { get; set; }
        public List<string> Flags { get; set; } = new();
        public string Explanation { get; set; } = string.Empty;
        public SymptomInputDto Symptoms { get; set; } = new();
    }
}
