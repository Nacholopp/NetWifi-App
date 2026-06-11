package backend.model.dto;

public record AnalyticsPredictionRequest(
    String layoutImageData,
    String apMaskImageData
) {
}
