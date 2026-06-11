package za.co.user.service.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.Getter;
import lombok.Setter;
import za.co.user.service.entity.base.BaseEntity;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class InvitationTokenEntity extends BaseEntity {
    private String token;
    private String email;
    @ManyToOne
    @JoinColumn(name = "admin_id")
    private AppUserEntity admin;
    private LocalDateTime expiryDate;
    private boolean isUsed;
}
