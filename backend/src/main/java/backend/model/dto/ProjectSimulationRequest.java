package backend.model.dto;

public record ProjectSimulationRequest(
    String layoutImageData,
    String apMaskImageData
) {
}
