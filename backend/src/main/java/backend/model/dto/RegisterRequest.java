package backend.model.dto;

import backend.model.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// Es record porque es inmutable, solo transporta datos
public record RegisterRequest(

    @NotBlank
    String username,

    @NotBlank @Email
    String email,

    @NotBlank @Pattern(
        regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
        message = "La contrasena debe tener al menos 8 caracteres, incluyendo letras y numeros"
    )
    String password,

    @NotNull
    Role role

) {

}