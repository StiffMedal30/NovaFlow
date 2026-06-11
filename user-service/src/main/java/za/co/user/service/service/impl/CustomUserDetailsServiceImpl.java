package za.co.user.service.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.repository.UserRepository;
import za.co.user.service.service.CustomUserService;
import za.co.user.service.utilities.Converter;

@Service
public class CustomUserDetailsServiceImpl implements CustomUserService {

    private final UserRepository userRepository;

    @Autowired
    public CustomUserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        AppUserEntity appUserEntity = Converter.optionalToEntity(userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail)));

        return new org.springframework.security.core.userdetails.User(
                appUserEntity.getUsername(),
                appUserEntity.getPassword(),
                appUserEntity.isEnabled(),
                appUserEntity.isAccountNonExpired(),
                appUserEntity.isCredentialsNonExpired(),
                appUserEntity.isAccountNonLocked(),
                AuthorityUtils.createAuthorityList("ROLE_" + appUserEntity.getRole())
        );
    }
}
