namespace maize_drs_backend.Services
{
    public interface IInferenceClient
    {
        Task<InferenceResult?> PredictAsync(
            byte[] imageBytes,
            string fileName,
            string mimeType,
            CancellationToken cancellationToken);
    }
}
