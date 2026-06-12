package za.co.api.gateway.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import za.co.api.gateway.records.GoogleOAuthRequest;
import za.co.api.gateway.records.OAuthAccountResponse;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class GoogleOAuthSuccessHandler implements AuthenticationSuccessHandler {

    private final RestTemplate restTemplate;

    public GoogleOAuthSuccessHandler(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Value("${novaflow.services.user-base:http://localhost:8082}")
    private String userServiceBaseUrl;

    @Value("${novaflow.services.internal-key:novaflow-local-internal-key}")
    private String internalServiceKey;

    @Value("${novaflow.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        try {
            OidcUser user = (OidcUser) authentication.getPrincipal();
            GoogleOAuthRequest oauthRequest = new GoogleOAuthRequest(
                    user.getSubject(),
                    user.getEmail(),
                    user.getFullName(),
                    Boolean.TRUE.equals(user.getEmailVerified())
            );

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Internal-Service-Key", internalServiceKey);
            ResponseEntity<OAuthAccountResponse> serviceResponse = restTemplate.exchange(
                    userServiceBaseUrl + "/api/user/oauth/google",
                    HttpMethod.POST,
                    new HttpEntity<>(oauthRequest, headers),
                    OAuthAccountResponse.class
            );
            OAuthAccountResponse result = serviceResponse.getBody();
            if (result == null) {
                redirectToLogin(response, "oauth", "failed");
                return;
            }

            if ("PENDING_ACTIVATION".equals(result.status())) {
                redirectToLogin(response, "activation", "pending");
                return;
            }

            String fragment = "token=" + encode(result.token())
                    + "&username=" + encode(result.username());
            response.sendRedirect(frontendBaseUrl + "/oauth/callback#" + fragment);
        } catch (Exception exception) {
            redirectToLogin(response, "oauth", "failed");
        }
    }

    private void redirectToLogin(HttpServletResponse response, String parameter, String value) throws IOException {
        String location = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/login")
                .queryParam(parameter, value)
                .build()
                .toUriString();
        response.sendRedirect(location);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
