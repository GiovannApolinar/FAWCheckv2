namespace maize_drs_backend.DTOs
{
    public class AssessmentListItemDto
    {
        public string RecordId { get; set; } = string.Empty;
        public string AssessedAtUtc { get; set; } = string.Empty;
        public int Dap { get; set; }
        public string? LocationText { get; set; }
        public int FinalScore { get; set; }
        public string ResponseBand { get; set; } = string.Empty;
        public string FinalConfidence { get; set; } = string.Empty;
        public int FinalConfidencePercent { get; set; }
        public string ImageName { get; set; } = string.Empty;
        public string Explanation { get; set; } = string.Empty;
    }

    public class PagedAssessmentsResponseDto
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int Total { get; set; }
        public List<AssessmentListItemDto> Items { get; set; } = new();
    }

    public class SyncAssessmentsResponseDto
    {
        public int TotalReceived { get; set; }
        public int Saved { get; set; }
        public int Failed { get; set; }
        public List<string> Errors { get; set; } = new();
        public List<EvaluateSaveResponseDto> Results { get; set; } = new();
    }
}
