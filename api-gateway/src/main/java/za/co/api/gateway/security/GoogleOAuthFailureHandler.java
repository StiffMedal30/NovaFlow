package za.co.api.gateway.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class GoogleOAuthFailureHandler implements AuthenticationFailureHandler {

    @Value("${novaflow.frontend.base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        String location = UriComponentsBuilder.fromUriString(frontendBaseUrl)
                .path("/login")
                .queryParam("oauth", "failed")
                .build()
                .toUriString();
        response.sendRedirect(location);
    }
}
