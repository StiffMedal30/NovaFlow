package za.co.user.service.records;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record GoogleOAuthRequest(
        @NotBlank String providerSubject,
        @NotBlank @Email String email,
        String name,
        boolean emailVerified
) {
}
