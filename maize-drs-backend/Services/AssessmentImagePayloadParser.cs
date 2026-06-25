namespace maize_drs_backend.Services
{
    public static class AssessmentImagePayloadParser
    {
        public const int MaxImageBytes = 5 * 1024 * 1024;

        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg",
            "image/png",
            "image/webp"
        };

        public static ParsedImagePayload Parse(string base64)
        {
            if (string.IsNullOrWhiteSpace(base64))
            {
                throw new ArgumentException("imageBase64 is required.");
            }

            var mimeType = "image/jpeg";
            var payload = base64;

            if (base64.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
            {
                var commaIndex = base64.IndexOf(',');
                if (commaIndex < 0)
                {
                    throw new ArgumentException("Invalid data URL image format.");
                }

                var header = base64[..commaIndex];
                payload = base64[(commaIndex + 1)..];

                var typePart = header[5..];
                var semicolonIndex = typePart.IndexOf(';');
                mimeType = semicolonIndex >= 0 ? typePart[..semicolonIndex] : typePart;
            }

            try
            {
                return new ParsedImagePayload(Convert.FromBase64String(payload), mimeType);
            }
            catch (FormatException)
            {
                throw new ArgumentException("Invalid base64 image payload.");
            }
        }

        public static void ValidateForUpload(byte[] bytes, string mimeType)
        {
            if (!AllowedImageContentTypes.Contains(mimeType))
            {
                throw new ArgumentException("Only JPEG, PNG, and WebP images are supported.");
            }

            if (bytes.Length == 0)
            {
                throw new ArgumentException("Uploaded image is empty.");
            }

            if (bytes.Length > MaxImageBytes)
            {
                throw new ArgumentException("Uploaded image exceeds the 5 MB limit.");
            }
        }
    }

    public readonly record struct ParsedImagePayload(byte[] Bytes, string MimeType);
}
