namespace maize_drs_backend.Options
{
    public class BlobStorageOptions
    {
        public const string SectionName = "BlobStorage";

        public string Provider { get; set; } = "AzureBlob";

        public string ConnectionString { get; set; } = string.Empty;

        public string ContainerName { get; set; } = "assessment-images";
    }
}
