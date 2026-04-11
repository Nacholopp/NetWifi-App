package backend.repository;

import backend.model.entity.AppUser;

import org.springframework.data.repository.CrudRepository;


public interface AppUserRepository extends CrudRepository<AppUser, Long> {
    public AppUser findByEmail(String email); //Que lo encuentre por email
    public boolean existsByEmail(String email); //Que diga si existe ese email en bd
    public boolean existsByUsername(String username);

}
