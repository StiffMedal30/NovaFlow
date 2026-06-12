package za.co.user.service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.user.service.entity.AccountActivationToken;
import za.co.user.service.entity.AppUserEntity;

import java.util.Optional;

public interface AccountActivationTokenRepository extends JpaRepository<AccountActivationToken, Long> {

    Optional<AccountActivationToken> findByTokenHash(String tokenHash);

    Optional<AccountActivationToken> findByUser(AppUserEntity user);
}
