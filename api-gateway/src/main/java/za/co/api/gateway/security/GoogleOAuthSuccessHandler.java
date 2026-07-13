package za.co.api.gateway.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import za.co.api.gateway.records.GoogleOAuthRequest;
import za.co.api.gateway.records.OAuthAccountResponse;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class GoogleOAuthSuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(GoogleOAuthSuccessHandler.class);

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
        OidcUser user = (OidcUser) authentication.getPrincipal();
        GoogleOAuthRequest oauthRequest = new GoogleOAuthRequest(
                user.getSubject(),
                user.getEmail(),
                user.getFullName(),
                Boolean.TRUE.equals(user.getEmailVerified())
        );

        OAuthAccountResponse result = requestOAuthAccount(oauthRequest);
        if (result == null) {
            throw new ServletException("Google OAuth user-service response body was empty");
        }

        logger.info("Google OAuth user-service response status={}", result.status());
        if ("PENDING_ACTIVATION".equals(result.status())) {
            redirectToLogin(response, "activation", "pending");
            return;
        }

        if (!"ACTIVE".equals(result.status())) {
            throw new ServletException("Unsupported Google OAuth user-service status: " + result.status());
        }

        String fragment = "token=" + encode(result.token())
                + "&username=" + encode(result.username());
        response.sendRedirect(frontendBaseUrl + "/oauth/callback#" + fragment);
    }

    private OAuthAccountResponse requestOAuthAccount(GoogleOAuthRequest oauthRequest) throws ServletException {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Internal-Service-Key", internalServiceKey);
        try {
            ResponseEntity<OAuthAccountResponse> serviceResponse = restTemplate.exchange(
                    userServiceBaseUrl + "/api/user/oauth/google",
                    HttpMethod.POST,
                    new HttpEntity<>(oauthRequest, headers),
                    OAuthAccountResponse.class
            );
            return serviceResponse.getBody();
        } catch (RestClientResponseException exception) {
            throw new ServletException(
                    "Google OAuth user-service call failed: HTTP "
                            + exception.getStatusCode()
                            + " - "
                            + exception.getResponseBodyAsString(),
                    exception
            );
        } catch (RuntimeException exception) {
            throw new ServletException("Google OAuth user-service call failed", exception);
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
