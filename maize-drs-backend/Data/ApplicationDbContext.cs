using maize_drs_backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace maize_drs_backend.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Assessment> Assessments => Set<Assessment>();
        public DbSet<AssessmentImage> AssessmentImages => Set<AssessmentImage>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(x => x.DisplayName).HasMaxLength(120);
                entity.Property(x => x.Section).HasMaxLength(120);
                entity.HasIndex(x => new { x.IsApproved, x.RegisteredAtUtc });
            });

            builder.Entity<Assessment>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.HasIndex(x => new { x.UserId, x.AssessedAtUtc });
                entity.HasIndex(x => new { x.UserId, x.FinalScore });
                entity.HasIndex(x => new { x.UserId, x.ClientGeneratedId }).IsUnique();

                entity.Property(x => x.ClientGeneratedId).HasMaxLength(80).IsRequired();
                entity.Property(x => x.ImageName).HasMaxLength(260).IsRequired();
                entity.Property(x => x.LocationText).HasMaxLength(200);
                entity.Property(x => x.ShotHoleLeafBand).HasMaxLength(40).IsRequired();
                entity.Property(x => x.ElongatedLesionBand).HasMaxLength(40).IsRequired();
                entity.Property(x => x.HoleBand).HasMaxLength(40).IsRequired();
                entity.Property(x => x.WhorlFurlDestruction).HasMaxLength(40).IsRequired();
                entity.Property(x => x.ResponseBand).HasMaxLength(40).IsRequired();
                entity.Property(x => x.Explanation).HasMaxLength(2000).IsRequired();
                entity.Property(x => x.ImagePredictionLabel).HasMaxLength(40);
                entity.Property(x => x.FinalConfidence).HasMaxLength(20).IsRequired();
                entity.Property(x => x.FusionFlagsJson).HasMaxLength(2000).IsRequired();

                entity.HasOne(x => x.User)
                    .WithMany()
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Image)
                    .WithOne(x => x.Assessment)
                    .HasForeignKey<AssessmentImage>(x => x.AssessmentId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<AssessmentImage>(entity =>
            {
                entity.HasKey(x => x.AssessmentId);
                entity.Property(x => x.OriginalFileName).HasMaxLength(260).IsRequired();
                entity.Property(x => x.ContentType).HasMaxLength(100).IsRequired();
                entity.Property(x => x.BlobName).HasMaxLength(512).IsRequired();
                entity.Property(x => x.ContentLength).IsRequired();
            });
        }
    }
}
