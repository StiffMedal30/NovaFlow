package za.co.api.gateway.records;

public record RegisterUserRequest(
        Long id,
        String username,
        String password,
        String email,
        String name,
        String role,
        String adminUsername,
        String ideaName
) {
}
