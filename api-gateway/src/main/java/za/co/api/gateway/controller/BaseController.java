package za.co.api.gateway.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.util.Map;
import java.util.stream.Collectors;

public abstract class BaseController {

    public static final String USER_SUBJECT_HEADER = "X-User-Subject";
    public static final String USER_ROLES_HEADER = "X-User-Roles";

    @Value("${novaflow.services.user:http://localhost:8082/api/user}")
    protected String userService;

    @Value("${novaflow.services.collaborator:http://localhost:8082/api/collaborator}")
    protected String collaboratorService;

    @Value("${novaflow.services.idea:http://localhost:8083/api/idea}")
    protected String ideaService;

    @Value("${novaflow.services.ai:http://localhost:8084/api/ai}")
    protected String aiService;

    @Value("${novaflow.services.chat:http://localhost:8085/api/chat}")
    protected String chatService;

    @Autowired
    protected RestTemplate restTemplate;

    protected ResponseEntity<?> forwardPostRequest(String url, Object body) {
        HttpHeaders headers = createForwardHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Object> requestEntity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );
        } catch (HttpStatusCodeException e) {
            return forwardedError(e);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected ResponseEntity<?> forwardGetRequest(String url) {
        HttpHeaders headers = createForwardHeaders();

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Object.class
            );
        } catch (HttpStatusCodeException e) {
            return forwardedError(e);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected ResponseEntity<?> forwardPutRequest(String url, Object body) {
        HttpHeaders headers = createForwardHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
        } catch (HttpStatusCodeException e) {
            return forwardedError(e);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected ResponseEntity<?> forwardDeleteRequest(String url) {
        HttpHeaders headers = createForwardHeaders();

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(headers),
                    Void.class
            );
        } catch (HttpStatusCodeException e) {
            return forwardedError(e);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected HttpHeaders createForwardHeaders() {
        HttpHeaders headers = new HttpHeaders();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            headers.set(USER_SUBJECT_HEADER, authentication.getName());

            String roles = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .filter(authority -> !"ROLE_AUTHENTICATED".equals(authority))
                    .collect(Collectors.joining(","));

            if (!roles.isBlank()) {
                headers.set(USER_ROLES_HEADER, roles);
            }
        }
        return headers;
    }

    private ResponseEntity<String> forwardedError(HttpStatusCodeException exception) {
        String body = exception.getResponseBodyAsString();
        if (body == null || body.isBlank()) {
            body = "{\"error\":\"Request failed.\"}";
        }
        return ResponseEntity.status(exception.getStatusCode())
                .contentType(MediaType.APPLICATION_JSON)
                .body(body);
    }
}
