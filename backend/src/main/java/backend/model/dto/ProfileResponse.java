package backend.model.dto;

import backend.model.entity.Role;

public record ProfileResponse(

    String username,
    String email,
    Role role

) {
    
}
