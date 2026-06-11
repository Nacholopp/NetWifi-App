package backend.service;



import backend.model.dto.LoginRequest;
import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;
import backend.model.dto.AuthResponse;


public interface UserServiceInterface {

    //Para hacer un return de algunos datos de usuario
    ProfileResponse saveProfile(RegisterRequest registerRequest);

    AuthResponse loginProfile(LoginRequest loginRequest);

    ProfileResponse getMyProfile(String email);

    void deleteMyProfile(String email);


}
