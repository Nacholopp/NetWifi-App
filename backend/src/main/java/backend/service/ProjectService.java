package backend.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import backend.model.dto.AnalyticsPredictionRequest;
import backend.model.dto.AnalyticsPredictionResponse;
import backend.model.dto.ProjectRequest;
import backend.model.dto.ProjectResponse;
import backend.model.dto.ProjectSimulationRequest;
import backend.model.dto.ProjectSimulationResponse;
import backend.model.entity.AppUser;
import backend.model.entity.Project;
import backend.repository.AppUserRepository;
import backend.repository.ProjectRepository;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;
    private final RestClient restClient;
    private final String analyticsServiceUrl;

    public ProjectService(
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            @Value("${analytics.service.url}") String analyticsServiceUrl
    ) {
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.restClient = RestClient.create();
        this.analyticsServiceUrl = analyticsServiceUrl;
    }

    public ProjectResponse saveProject(String email, ProjectRequest request) {
        AppUser user = getUser(email);

        Project project = Project.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .projectName(request.projectName().trim())
                .imageData(request.imageData())
                .layoutImageData(request.layoutImageData())
                .apMaskImageData(request.apMaskImageData())
                .build();

        return toResponse(projectRepository.save(project));
    }

    public List<ProjectResponse> getMyProjects(String email) {
        AppUser user = getUser(email);
        return projectRepository.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectResponse updateProject(String email, Long projectId, ProjectRequest request) {
        AppUser user = getUser(email);
        Project project = projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        project.setProjectName(request.projectName().trim());
        project.setImageData(request.imageData());
        project.setLayoutImageData(request.layoutImageData());
        project.setApMaskImageData(request.apMaskImageData());

        return toResponse(projectRepository.save(project));
    }

    public void deleteProject(String email, Long projectId) {
        AppUser user = getUser(email);
        Project project = projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        projectRepository.delete(project);
    }

    public ProjectSimulationResponse simulateProject(String email, Long projectId, ProjectSimulationRequest request) {
        AppUser user = getUser(email);
        Project project = projectRepository.findByIdAndUserId(projectId, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        String layoutImageData = chooseImage(request.layoutImageData(), project.getLayoutImageData());
        String apMaskImageData = chooseImage(request.apMaskImageData(), project.getApMaskImageData());

        if (layoutImageData == null || apMaskImageData == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El proyecto no tiene imagenes separadas para simular");
        }

        AnalyticsPredictionResponse response = restClient.post()
                .uri(analyticsServiceUrl + "/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .body(new AnalyticsPredictionRequest(layoutImageData, apMaskImageData))
                .retrieve()
                .body(AnalyticsPredictionResponse.class);

        if (response == null || response.predictionImageData() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "El servicio de simulacion no devolvio resultado");
        }

        return new ProjectSimulationResponse(response.predictionImageData());
    }

    private AppUser getUser(String email) {
        AppUser user = appUserRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no autenticado");
        }
        return user;
    }

    private String chooseImage(String requestImage, String projectImage) {
        if (requestImage != null && !requestImage.isBlank()) {
            return requestImage;
        }
        if (projectImage != null && !projectImage.isBlank()) {
            return projectImage;
        }
        return null;
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getUserId(),
                project.getUsername(),
                project.getProjectName(),
                project.getImageData(),
                project.getLayoutImageData(),
                project.getApMaskImageData()
        );
    }
}
