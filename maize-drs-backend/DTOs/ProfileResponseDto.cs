namespace maize_drs_backend.DTOs
{
    public class ProfileResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Section { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool CanDeleteAccount { get; set; }
    }
}
