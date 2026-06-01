package za.co.api.gateway.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;

public abstract class BaseController {

    public static final String USER_SERVICE = "http://user-service:8082/api/user";
    public static final String USER_COLLABORATOR_SERVICE = "http://user-service:8082/api/collaborator";
    public static final String IDEA_SERVICE = "http://idea-service:8083/api/idea";
    public static final String AI_SERVICE = "http://ai-service:8084/api/ai";
    public static final String CHAT_SERVICE = "http://chat-service:8085/api/chat";

    @Autowired
    protected RestTemplate restTemplate;

    protected ResponseEntity<?> forwardPostRequest(String url, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Forward Authorization header if present
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (requestAttributes instanceof ServletRequestAttributes servletRequestAttributes) {
            String authHeader = servletRequestAttributes.getRequest().getHeader("Authorization");
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
        }

        HttpEntity<Object> requestEntity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }

    protected ResponseEntity<?> forwardGetRequest(String url) {
        HttpHeaders headers = new HttpHeaders();

        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (requestAttributes instanceof ServletRequestAttributes servletRequestAttributes) {
            String authHeader = servletRequestAttributes.getRequest().getHeader("Authorization");
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
        }

        try {
            return restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(headers),
                    Object.class
            );
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Request failed: " + e.getMessage()));
        }
    }
}
