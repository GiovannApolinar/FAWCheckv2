using Microsoft.AspNetCore.Identity;

namespace maize_drs_backend.Models
{
    public class ApplicationUser : IdentityUser<Guid>
    {
        public string? DisplayName { get; set; }
        public string? Section { get; set; }
        public DateTime RegisteredAtUtc { get; set; }
        public bool IsApproved { get; set; }
        public DateTime? ApprovedAtUtc { get; set; }
        public Guid? ApprovedByUserId { get; set; }
    }
}
