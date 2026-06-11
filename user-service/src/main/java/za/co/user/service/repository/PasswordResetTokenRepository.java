package za.co.user.service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.user.service.entity.PasswordResetToken;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByToken(String token);
}
