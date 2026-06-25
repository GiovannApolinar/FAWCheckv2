using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using maize_drs_backend.Models;
using maize_drs_backend.Options;
using Microsoft.Extensions.Options;

namespace maize_drs_backend.Services
{
    public class AzureBlobAssessmentImageStore : IAssessmentImageStore
    {
        private readonly BlobContainerClient _containerClient;
        private readonly ILogger<AzureBlobAssessmentImageStore> _logger;

        public AzureBlobAssessmentImageStore(
            IOptions<BlobStorageOptions> options,
            ILogger<AzureBlobAssessmentImageStore> logger)
        {
            _logger = logger;
            var settings = options.Value;

            if (string.IsNullOrWhiteSpace(settings.ConnectionString))
            {
                throw new InvalidOperationException("Missing BlobStorage:ConnectionString.");
            }

            if (string.IsNullOrWhiteSpace(settings.ContainerName))
            {
                throw new InvalidOperationException("Missing BlobStorage:ContainerName.");
            }

            _containerClient = new BlobContainerClient(settings.ConnectionString, settings.ContainerName);
        }

        public async Task<StoredImageMetadata> SaveAsync(
            Guid assessmentId,
            string originalFileName,
            string contentType,
            byte[] bytes,
            CancellationToken cancellationToken)
        {
            await _containerClient.CreateIfNotExistsAsync(PublicAccessType.None, cancellationToken: cancellationToken);

            var blobName = BuildBlobName(assessmentId, originalFileName);
            var blobClient = _containerClient.GetBlobClient(blobName);

            using var stream = new MemoryStream(bytes, writable: false);
            await blobClient.UploadAsync(
                stream,
                new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType
                    }
                },
                cancellationToken);

            return new StoredImageMetadata(blobName, bytes.LongLength);
        }

        public async Task<byte[]?> ReadAsync(AssessmentImage image, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(image.BlobName))
            {
                return null;
            }

            try
            {
                var download = await _containerClient
                    .GetBlobClient(image.BlobName)
                    .DownloadContentAsync(cancellationToken);

                return download.Value.Content.ToArray();
            }
            catch (RequestFailedException ex) when (ex.Status == 404)
            {
                _logger.LogWarning("Blob {BlobName} was not found for assessment {AssessmentId}", image.BlobName, image.AssessmentId);
                return null;
            }
        }

        public async Task DeleteAsync(AssessmentImage image, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(image.BlobName))
            {
                return;
            }

            await _containerClient
                .GetBlobClient(image.BlobName)
                .DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots, cancellationToken: cancellationToken);
        }

        private static string BuildBlobName(Guid assessmentId, string originalFileName)
        {
            var extension = Path.GetExtension(originalFileName);
            if (string.IsNullOrWhiteSpace(extension))
            {
                extension = ".jpg";
            }

            return $"assessments/{assessmentId:N}/{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        }
    }
}
