package za.co.user.service.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import za.co.user.service.entity.base.BaseEntity;
import za.co.user.service.enums.Role;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "app_user")
@Getter
@Setter
public class AppUserEntity extends BaseEntity implements UserDetails {
    @Column(name = "email", nullable = false)
    private String email;
    @Column(name = "name", nullable = false)
    private String name;
    @Column(name = "username", nullable = false)
    private String username;
    @Column(name = "password", nullable = false)
    private String password;
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;
    @Column(name = "isAccountNonExpired", nullable = false)
    private boolean isAccountNonExpired;
    @Column(name = "isEnabled", nullable = false)
    private boolean isEnabled;
    @Column(name = "isAccountNonLocked", nullable = false)
    private boolean isAccountNonLocked;
    @Column(name = "isCredentialsNonExpired", nullable = false)
    private boolean isCredentialsNonExpired;
    // === Link collaborator -> admin ===
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id")
    private AppUserEntity admin;
    // === Link admin -> collaborators ===
    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    private List<AppUserEntity> collaborators = new ArrayList<>();


    // Spring Security's UserDetails methods

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Role is assumed to be a single role value, like 'USER', 'ADMIN'
        return AuthorityUtils.createAuthorityList("ROLE_" + this.role);
    }

    @Override
    public boolean isAccountNonExpired() {
        return isAccountNonExpired; // If you want to implement account expiration, modify accordingly
    }

    public void setAccountNonExpired(boolean accountNonExpired) {
        isAccountNonExpired = accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return isAccountNonLocked; // If you want to implement account locking, modify accordingly
    }

    public void setAccountNonLocked(boolean accountNonLocked) {
        isAccountNonLocked = accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return isCredentialsNonExpired; // If you want to implement password expiration, modify accordingly
    }

    public void setCredentialsNonExpired(boolean credentialsNonExpired) {
        isCredentialsNonExpired = credentialsNonExpired;
    }

    @Override
    public boolean isEnabled() {
        return isEnabled; // Modify based on your requirements for account enabling/disabling
    }

    public void setEnabled(boolean enabled) {
        isEnabled = enabled;
    }
}
