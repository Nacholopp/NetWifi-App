package backend.model.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "username", nullable = false)
    private String username;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(name = "image_data", nullable = false, columnDefinition = "TEXT")
    private String imageData;

    @Column(name = "layout_image_data", columnDefinition = "TEXT")
    private String layoutImageData;

    @Column(name = "ap_mask_image_data", columnDefinition = "TEXT")
    private String apMaskImageData;
}
