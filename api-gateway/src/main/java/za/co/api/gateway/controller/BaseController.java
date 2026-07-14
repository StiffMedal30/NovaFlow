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

import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public abstract class BaseController {

    public static final String USER_SUBJECT_HEADER = "X-User-Subject";
    public static final String USER_ROLES_HEADER = "X-User-Roles";
    private static final Set<String> HOP_BY_HOP_RESPONSE_HEADERS = Set.of(
            "connection",
            "content-length",
            "keep-alive",
            "proxy-authenticate",
            "proxy-authorization",
            "te",
            "trailer",
            "transfer-encoding",
            "upgrade"
    );

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
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );
            return forwardedResponse(response);
        } catch (HttpStatusCodeException e) {
            return forwardedError(e);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected ResponseEntity<?> forwardGetRequest(String url) {
        HttpHeaders headers = createForwardHeaders();

        try {
            ResponseEntity<Object> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Object.class
            );
            return forwardedResponse(response);
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
            ResponseEntity<Map> response = restTemplate.exchange(
                    url,
                    HttpMethod.PUT,
                    new HttpEntity<>(body, headers),
                    Map.class
            );
            return forwardedResponse(response);
        } catch (HttpStatusCodeException e) {
            return forwardedError(e);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected ResponseEntity<?> forwardDeleteRequest(String url) {
        HttpHeaders headers = createForwardHeaders();

        try {
            ResponseEntity<Void> response = restTemplate.exchange(
                    url,
                    HttpMethod.DELETE,
                    new HttpEntity<>(headers),
                    Void.class
            );
            return forwardedResponse(response);
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

    private ResponseEntity<?> forwardedResponse(ResponseEntity<?> response) {
        HttpHeaders headers = new HttpHeaders();
        response.getHeaders().forEach((name, values) -> {
            if (!isHopByHopHeader(name)) {
                headers.put(name, new ArrayList<>(values));
            }
        });

        return ResponseEntity.status(response.getStatusCode())
                .headers(headers)
                .body(response.getBody());
    }

    private boolean isHopByHopHeader(String name) {
        return HOP_BY_HOP_RESPONSE_HEADERS.contains(name.toLowerCase(Locale.ROOT));
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
