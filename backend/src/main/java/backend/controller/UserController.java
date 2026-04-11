package backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;
import backend.service.UserServiceInterface;
import jakarta.validation.Valid;


@RestController
public class UserController {

    @Autowired UserServiceInterface userService;


    @PostMapping("/users/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse register(@RequestBody @Valid RegisterRequest registerRequest) {
        return userService.saveProfile(registerRequest);
    }

}
