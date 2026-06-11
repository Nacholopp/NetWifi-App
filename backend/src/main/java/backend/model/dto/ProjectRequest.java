package backend.model.dto;

import jakarta.validation.constraints.NotBlank;

public record ProjectRequest(
    @NotBlank
    String projectName,

    @NotBlank
    String imageData,

    @NotBlank
    String layoutImageData,

    @NotBlank
    String apMaskImageData
) {
}
