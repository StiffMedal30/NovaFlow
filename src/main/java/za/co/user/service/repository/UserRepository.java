package za.co.user.service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import za.co.user.service.entity.AppUserEntity;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<AppUserEntity, Long> {
    Optional<AppUserEntity> findByUsername(String username);

    Optional<AppUserEntity> findByUsernameAndEmail(String username, String email);

    Optional<AppUserEntity> findByEmail(String email);

    Optional<AppUserEntity> findByIdAndAdmin_Username(Long id, String adminUsername);
    
    List<AppUserEntity> findByAdmin_Username(String adminUsername);

    // Checking if user exists by email or username
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
