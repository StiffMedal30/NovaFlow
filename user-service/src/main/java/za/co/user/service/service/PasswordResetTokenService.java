package za.co.user.service.service;

import za.co.user.service.entity.PasswordResetToken;

public interface PasswordResetTokenService {
    PasswordResetToken getPasswordResetToken(String token);
}
