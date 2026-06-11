package backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import backend.model.dto.ProjectRequest;
import backend.model.dto.ProjectResponse;
import backend.model.dto.ProjectSimulationRequest;
import backend.model.dto.ProjectSimulationResponse;
import backend.service.ProjectService;
import jakarta.validation.Valid;

@RestController
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @PostMapping("/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse saveProject(Authentication authentication, @RequestBody @Valid ProjectRequest request) {
        return projectService.saveProject(getEmail(authentication), request);
    }

    @GetMapping("/projects/me")
    public List<ProjectResponse> getMyProjects(Authentication authentication) {
        return projectService.getMyProjects(getEmail(authentication));
    }

    @PutMapping("/projects/{id}")
    public ProjectResponse updateProject(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody @Valid ProjectRequest request
    ) {
        return projectService.updateProject(getEmail(authentication), id, request);
    }

    @DeleteMapping("/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProject(Authentication authentication, @PathVariable Long id) {
        projectService.deleteProject(getEmail(authentication), id);
    }

    @PostMapping("/projects/{id}/simulation")
    public ProjectSimulationResponse simulateProject(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody ProjectSimulationRequest request
    ) {
        return projectService.simulateProject(getEmail(authentication), id, request);
    }

    private String getEmail(Authentication authentication) {
        if (authentication == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }

        return authentication.getName();
    }
}
