package backend.service;


import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.server.ResponseStatusException;

import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;
import backend.model.dto.AuthResponse;
import backend.model.dto.LoginRequest;
import backend.model.entity.AppUser;
import backend.repository.AppUserRepository;





@Service
public class UserService implements UserServiceInterface{

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public UserService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public ProfileResponse saveProfile(RegisterRequest registerRequest) {
        if (appUserRepository.existsByUsername(registerRequest.username())) {
            throw new DataIntegrityViolationException("Ya existe un usuario con ese username");
        }

        if (appUserRepository.existsByEmail(registerRequest.email())) {
            throw new DataIntegrityViolationException("Ya existe un usuario con ese email");
        }

        AppUser user = AppUser.builder()
                .username(registerRequest.username())
                .email(registerRequest.email())
                .password(passwordEncoder.encode(registerRequest.password()))
                .role((registerRequest.role()))
                .build();

        AppUser savedUser = appUserRepository.save(user);

        return new ProfileResponse(savedUser.getUsername(), savedUser.getEmail(), savedUser.getRole());

        
    }

    @Override
    public AuthResponse loginProfile(LoginRequest loginRequest) {
        
        if(appUserRepository.existsByEmail(loginRequest.email())) {
            AppUser user = appUserRepository.findByEmail(loginRequest.email());
            if (passwordEncoder.matches(loginRequest.password(), user.getPassword())) {
                String token = jwtService.generateToken(user);
                return new AuthResponse(token, user.getUsername(), user.getRole());
            } else {
                throw new DataIntegrityViolationException("Contraseña incorrecta");
            }
        }else {
            throw new DataIntegrityViolationException("No existe un usuario con ese email");
        }

    }

    @Override
    public ProfileResponse getMyProfile(String email) {
        AppUser user = appUserRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }

        return new ProfileResponse(user.getUsername(), user.getEmail(), user.getRole());
    }

}
