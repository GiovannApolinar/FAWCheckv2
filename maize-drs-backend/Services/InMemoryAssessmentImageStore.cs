using System.Collections.Concurrent;
using maize_drs_backend.Models;

namespace maize_drs_backend.Services
{
    public class InMemoryAssessmentImageStore : IAssessmentImageStore
    {
        private readonly ConcurrentDictionary<string, byte[]> _images = new(StringComparer.Ordinal);

        public Task<StoredImageMetadata> SaveAsync(
            Guid assessmentId,
            string originalFileName,
            string contentType,
            byte[] bytes,
            CancellationToken cancellationToken)
        {
            var extension = Path.GetExtension(originalFileName);
            if (string.IsNullOrWhiteSpace(extension))
            {
                extension = ".jpg";
            }

            var blobName = $"in-memory/{assessmentId:N}/{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            _images[blobName] = bytes.ToArray();
            return Task.FromResult(new StoredImageMetadata(blobName, bytes.LongLength));
        }

        public Task<byte[]?> ReadAsync(AssessmentImage image, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(image.BlobName))
            {
                return Task.FromResult<byte[]?>(null);
            }

            return Task.FromResult(_images.TryGetValue(image.BlobName, out var bytes) ? bytes.ToArray() : null);
        }

        public Task DeleteAsync(AssessmentImage image, CancellationToken cancellationToken)
        {
            if (!string.IsNullOrWhiteSpace(image.BlobName))
            {
                _images.TryRemove(image.BlobName, out _);
            }

            return Task.CompletedTask;
        }

        public bool Contains(string blobName) => _images.ContainsKey(blobName);
    }
}
