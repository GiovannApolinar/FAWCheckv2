namespace maize_drs_backend.Legacy
{
    public class LegacyUserRecord
    {
        public string SourceId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public DateTime? RegisteredAtUtc { get; set; }
    }
}
