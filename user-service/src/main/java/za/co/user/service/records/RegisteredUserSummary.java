package za.co.user.service.records;

import java.time.LocalDateTime;

public record RegisteredUserSummary(
        String email,
        LocalDateTime registeredAt,
        LocalDateTime lastLoginAt
) {
}
