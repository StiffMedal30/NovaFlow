package za.co.user.service.service.impl;

import org.springframework.stereotype.Service;
import za.co.user.service.entity.PasswordResetToken;
import za.co.user.service.repository.PasswordResetTokenRepository;
import za.co.user.service.service.PasswordResetTokenService;
import za.co.user.service.utilities.Converter;

@Service
public class PasswordResetTokenServiceImpl implements PasswordResetTokenService {

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    public PasswordResetTokenServiceImpl(PasswordResetTokenRepository passwordResetTokenRepository) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
    }

    @Override
    public PasswordResetToken getPasswordResetToken(String token) {
        return Converter.optionalToEntity(passwordResetTokenRepository.findByToken(token));
    }
}
