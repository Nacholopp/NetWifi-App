package backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;
import backend.service.UserServiceInterface;
import jakarta.validation.Valid;
import backend.model.dto.AuthResponse;
import backend.model.dto.LoginRequest;


@RestController
public class UserController {

    @Autowired UserServiceInterface userService;


    @PostMapping("/users/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse register(@RequestBody @Valid RegisterRequest registerRequest) {
        return userService.saveProfile(registerRequest);
    }

    @PostMapping("/users/login")
    public AuthResponse login(
        @RequestBody @Valid LoginRequest loginRequest,
        @RequestHeader(name = "Authorization", required = false) String authorizationHeader
    ) {
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ya estás logeado");
        }
    
        return userService.loginProfile(loginRequest);
    }


    @GetMapping("/users/me")
    public ProfileResponse me(Authentication authentication) {
        return userService.getMyProfile(authentication.getName());
    }


}
