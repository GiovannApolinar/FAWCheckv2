namespace maize_drs_backend.DTOs
{
    public class SyncAssessmentsRequestDto
    {
        public List<EvaluateSaveRequestDto> Records { get; set; } = new();
    }
}
