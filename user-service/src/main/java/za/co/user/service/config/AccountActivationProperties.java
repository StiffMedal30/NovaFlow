package za.co.user.service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "app.account-activation")
public record AccountActivationProperties(Duration tokenTtl) {
}
