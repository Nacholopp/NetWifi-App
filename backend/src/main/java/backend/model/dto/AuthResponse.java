package backend.model.dto;

import backend.model.entity.Role;

public record AuthResponse(
    String token,
    String username,
    Role role
) {}
