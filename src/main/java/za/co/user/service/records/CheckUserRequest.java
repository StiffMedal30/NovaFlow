package za.co.user.service.records;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CheckUserRequest(
    @Email(message = "Email must be valid")
    @NotBlank(message = "Email is required")
    String email,
    
    @NotBlank(message = "Username is required")
    String username
) {
}