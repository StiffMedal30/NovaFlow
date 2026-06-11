package za.co.user.service.records;

public record NewPasswordRecord(String username, String email, String newPassword, String confirmPassword) {
}
