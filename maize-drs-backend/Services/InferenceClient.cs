using System.Net.Http.Headers;
using System.Text.Json;

namespace maize_drs_backend.Services
{
    public class InferenceClient : IInferenceClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<InferenceClient> _logger;
        private readonly string _predictPath;

        public InferenceClient(HttpClient httpClient, IConfiguration configuration, ILogger<InferenceClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            var baseUrl = configuration["Inference:BaseUrl"];
            _predictPath = configuration["Inference:PredictPath"] ?? "/predict";

            if (string.IsNullOrWhiteSpace(baseUrl))
            {
                throw new InvalidOperationException("Missing Inference:BaseUrl configuration.");
            }

            if (_httpClient.BaseAddress is null)
            {
                _httpClient.BaseAddress = new Uri(baseUrl);
            }

            _httpClient.Timeout = TimeSpan.FromSeconds(12);
        }

        public async Task<InferenceResult?> PredictAsync(
            byte[] imageBytes,
            string fileName,
            string mimeType,
            CancellationToken cancellationToken)
        {
            using var formData = new MultipartFormDataContent();
            using var imageContent = new ByteArrayContent(imageBytes);
            imageContent.Headers.ContentType = new MediaTypeHeaderValue(string.IsNullOrWhiteSpace(mimeType) ? "image/jpeg" : mimeType);
            formData.Add(imageContent, "file", string.IsNullOrWhiteSpace(fileName) ? "upload.jpg" : fileName);

            var relativePath = _predictPath.StartsWith('/') ? _predictPath[1..] : _predictPath;

            using var response = await _httpClient.PostAsync(relativePath, formData, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Inference API returned {StatusCode}", (int)response.StatusCode);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            var payload = await JsonSerializer.DeserializeAsync<InferenceApiResponse>(
                stream,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true },
                cancellationToken);

            if (payload?.Prediction is null)
            {
                return null;
            }

            var label = FusionService.NormalizeLabel(payload.Prediction);
            var confidence = Math.Clamp(payload.Confidence, 0, 100);
            return new InferenceResult(label, confidence);
        }

        private sealed class InferenceApiResponse
        {
            public string? Prediction { get; set; }
            public double Confidence { get; set; }
        }
    }
}
