package za.co.api.gateway.records;

public record PasswordResetRequest(
        String username,
        String email,
        String newPassword,
        String confirmPassword
) {
}
