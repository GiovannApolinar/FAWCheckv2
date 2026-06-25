using maize_drs_backend.Models;

namespace maize_drs_backend.Services
{
    public interface IAssessmentImageStore
    {
        Task<StoredImageMetadata> SaveAsync(
            Guid assessmentId,
            string originalFileName,
            string contentType,
            byte[] bytes,
            CancellationToken cancellationToken);

        Task<byte[]?> ReadAsync(AssessmentImage image, CancellationToken cancellationToken);

        Task DeleteAsync(AssessmentImage image, CancellationToken cancellationToken);
    }

    public sealed record StoredImageMetadata(string BlobName, long ContentLength);
}
