package backend.model.dto;

public record ProjectResponse(
    Long id,
    Long userId,
    String username,
    String projectName,
    String imageData,
    String layoutImageData,
    String apMaskImageData
) {
}
