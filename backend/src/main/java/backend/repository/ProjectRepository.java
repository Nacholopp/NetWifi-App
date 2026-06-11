package backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.repository.CrudRepository;

import backend.model.entity.Project;

public interface ProjectRepository extends CrudRepository<Project, Long> {
    public List<Project> findByUserId(Long userId);
    public Optional<Project> findByIdAndUserId(Long id, Long userId);
    public void deleteByUserId(Long userId);
}
