package za.co.user.service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.user.service.entity.InvitationTokenEntity;

public interface InvitationTokenRepository extends JpaRepository<InvitationTokenEntity, Long> {
}
