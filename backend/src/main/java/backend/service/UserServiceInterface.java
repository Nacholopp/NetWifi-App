package backend.service;



import backend.model.dto.ProfileResponse;
import backend.model.dto.RegisterRequest;


public interface UserServiceInterface {

    //Para hacer un return de algunos datos de usuario
    ProfileResponse saveProfile(RegisterRequest registerRequest);




}
