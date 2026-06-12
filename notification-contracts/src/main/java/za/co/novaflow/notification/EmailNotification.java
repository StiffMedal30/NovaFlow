package za.co.novaflow.notification;

import java.time.Instant;
import java.util.UUID;

public record EmailNotification(
        UUID messageId,
        EmailNotificationType type,
        String recipient,
        String token,
        Instant requestedAt
) {
    public static EmailNotification create(EmailNotificationType type, String recipient, String token) {
        return new EmailNotification(UUID.randomUUID(), type, recipient, token, Instant.now());
    }
}
