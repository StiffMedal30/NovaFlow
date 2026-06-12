package za.co.api.gateway.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "novaflow.oauth.google")
public record GoogleOAuthProperties(
        boolean enabled,
        String clientId,
        String clientSecret
) {
}
