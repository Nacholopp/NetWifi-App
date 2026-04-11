package backend.service;


import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;
import backend.model.entity.AppUser;
import backend.repository.AppUserRepository;



@Service
public class UserService implements UserServiceInterface{

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

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

}
