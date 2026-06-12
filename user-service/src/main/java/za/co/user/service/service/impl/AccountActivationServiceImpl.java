package za.co.user.service.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.user.service.config.AccountActivationProperties;
import za.co.user.service.entity.AccountActivationToken;
import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.enums.ActivationStatus;
import za.co.user.service.repository.AccountActivationTokenRepository;
import za.co.user.service.repository.UserRepository;
import za.co.user.service.service.AccountActivationService;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@EnableConfigurationProperties(AccountActivationProperties.class)
public class AccountActivationServiceImpl implements AccountActivationService {

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final AccountActivationTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final AccountActivationProperties properties;

    @Override
    @Transactional
    public String issueToken(AppUserEntity user) {
        String rawToken = generateToken();
        AccountActivationToken activationToken = tokenRepository.findByUser(user)
                .orElseGet(AccountActivationToken::new);
        activationToken.setUser(user);
        activationToken.setTokenHash(hash(rawToken));
        activationToken.setExpiryDate(LocalDateTime.now().plus(properties.tokenTtl()));
        activationToken.setUsedAt(null);
        tokenRepository.save(activationToken);
        return rawToken;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasUsableToken(AppUserEntity user) {
        LocalDateTime now = LocalDateTime.now();
        return tokenRepository.findByUser(user)
                .filter(token -> token.getUsedAt() == null)
                .filter(token -> token.getExpiryDate().isAfter(now))
                .isPresent();
    }

    @Override
    @Transactional
    public ActivationStatus activate(String rawToken) {
        AccountActivationToken activationToken = tokenRepository.findByTokenHash(hash(rawToken))
                .orElse(null);
        if (activationToken == null) {
            return ActivationStatus.INVALID;
        }
        if (activationToken.getUsedAt() != null) {
            return ActivationStatus.USED;
        }
        if (!activationToken.getExpiryDate().isAfter(LocalDateTime.now())) {
            return ActivationStatus.EXPIRED;
        }

        AppUserEntity user = activationToken.getUser();
        if (user.isEnabled()) {
            activationToken.setUsedAt(LocalDateTime.now());
            tokenRepository.save(activationToken);
            return ActivationStatus.USED;
        }

        user.setEnabled(true);
        activationToken.setUsedAt(LocalDateTime.now());
        userRepository.save(user);
        tokenRepository.save(activationToken);
        return ActivationStatus.ACTIVATED;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
