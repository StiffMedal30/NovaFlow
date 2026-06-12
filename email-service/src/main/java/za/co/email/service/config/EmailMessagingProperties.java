package za.co.email.service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.messaging.email")
public record EmailMessagingProperties(
        String exchange,
        String queue,
        String routingKey,
        String deadLetterExchange,
        String deadLetterQueue,
        String deadLetterRoutingKey
) {
}
