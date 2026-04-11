package backend.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

//Esta es la entidad de la base de datos

@Entity
@Builder //Genera los constructores
@Data //Genera los getters y setters
@NoArgsConstructor  // constructor vacío requerido por JPA
@AllArgsConstructor // necesario para que @Builder funcione correctamente si no dan fallos
@Table(name = "app_users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;    

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;
 
    
}
