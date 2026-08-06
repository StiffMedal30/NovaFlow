package za.co.api.gateway.controller;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.api.gateway.config.GoogleOAuthProperties;

import java.util.Map;

@RestController
@RequestMapping("/api/oauth")
@EnableConfigurationProperties(GoogleOAuthProperties.class)
public class OAuthController {

    private final GoogleOAuthProperties googleOAuthProperties;

    public OAuthController(GoogleOAuthProperties googleOAuthProperties) {
        this.googleOAuthProperties = googleOAuthProperties;
    }

    @GetMapping("/google/status")
    public Map<String, Boolean> googleStatus() {
        return Map.of("enabled", googleOAuthProperties.enabled());
    }
}
