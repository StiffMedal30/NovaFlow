package za.co.user.service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import lombok.Getter;
import lombok.Setter;
import za.co.user.service.entity.base.BaseEntity;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class PasswordResetToken extends BaseEntity {
    private String token;
    @OneToOne
    private AppUserEntity user;
    private LocalDateTime expiryDate;
}
