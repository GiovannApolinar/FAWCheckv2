namespace maize_drs_backend.DTOs
{
    public class PendingUserResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string RegisteredAtUtc { get; set; } = string.Empty;
    }
}
