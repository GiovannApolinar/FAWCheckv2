namespace maize_drs_backend.DTOs
{
    public class EvaluateSaveResponseDto
    {
        public string RecordId { get; set; } = string.Empty;
        public int RuleScore { get; set; }
        public int FinalScore { get; set; }
        public string ResponseBand { get; set; } = string.Empty;
        public ImagePredictionDto? ImagePrediction { get; set; }
        public string FinalConfidence { get; set; } = "low";
        public int FinalConfidencePercent { get; set; }
        public List<string> Flags { get; set; } = new();
        public string Explanation { get; set; } = string.Empty;
        public string SavedAtUtc { get; set; } = string.Empty;
    }

    public class AssessmentEvaluationResponseDto
    {
        public int RuleScore { get; set; }
        public int FinalScore { get; set; }
        public string ResponseBand { get; set; } = string.Empty;
        public ImagePredictionDto? ImagePrediction { get; set; }
        public string FinalConfidence { get; set; } = "low";
        public int FinalConfidencePercent { get; set; }
        public List<string> Flags { get; set; } = new();
        public string Explanation { get; set; } = string.Empty;
    }

    public class ImagePredictionDto
    {
        public string Label { get; set; } = string.Empty;
        public double Confidence { get; set; }
    }
}
