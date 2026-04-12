package backend.controller;

import backend.exception.GlobalExceptionHandler;
import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;
import backend.model.entity.Role;
import backend.repository.AppUserRepository;
import backend.service.JwtService;
import backend.service.UserServiceInterface;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
@Import(GlobalExceptionHandler.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserServiceInterface userService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @Test
    void registerReturnsCreatedWhenPayloadIsValid() throws Exception {
        given(userService.saveProfile(any(RegisterRequest.class)))
                .willReturn(new ProfileResponse("nacho", "nacho@example.com", Role.USER));

        String body = """
            {
              "username": "nacho",
              "email": "nacho@example.com",
              "password": "abcde123",
              "role": "USER"
            }
            """;

        mockMvc.perform(post("/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("nacho"))
                .andExpect(jsonPath("$.email").value("nacho@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void registerReturnsBadRequestWhenEmailIsInvalid() throws Exception {
        String body = """
            {
              "username": "nacho",
              "email": "correo-invalido",
              "password": "abcde123",
              "role": "USER"
            }
            """;

        mockMvc.perform(post("/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void registerReturnsConflictWhenServiceThrowsDataIntegrityViolation() throws Exception {
        given(userService.saveProfile(any(RegisterRequest.class)))
                .willThrow(new DataIntegrityViolationException("Ya existe un usuario con ese email"));

        String body = """
            {
              "username": "nacho",
              "email": "nacho@example.com",
              "password": "abcde123",
              "role": "USER"
            }
            """;

        mockMvc.perform(post("/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya existe un usuario con ese email"));
    }

    @Test
    void registerReturnsBadRequestWhenRoleEnumIsInvalid() throws Exception {
        String body = """
            {
              "username": "nacho",
              "email": "nacho@example.com",
              "password": "abcde123",
              "role": "INVALID_ROLE"
            }
            """;

        mockMvc.perform(post("/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").exists());
    }
}
