package za.co.user.service.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.entity.PasswordResetToken;
import za.co.user.service.enums.Role;
import za.co.user.service.records.AppUserRecord;
import za.co.user.service.records.NewPasswordRecord;
import za.co.user.service.repository.PasswordResetTokenRepository;
import za.co.user.service.repository.UserRepository;
import za.co.user.service.security.JwtProvider;
import za.co.user.service.service.CustomUserService;
import za.co.user.service.service.EmailService;
import za.co.user.service.service.UserService;
import za.co.user.service.utilities.Converter;
import za.co.user.service.records.CheckUserRequest;   
import za.co.user.service.records.CheckUserResponse;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class UserServiceImpl implements UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final EmailService emailService;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetTokenServiceImpl passwordResetTokenService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserService customUserService;

    public UserServiceImpl(PasswordEncoder passwordEncoder, UserRepository userRepository, JwtProvider jwtProvider,
                           EmailService emailService, PasswordResetTokenRepository tokenRepository,
                           PasswordResetTokenServiceImpl passwordResetTokenService,
                           AuthenticationManager authenticationManager, CustomUserService customUserService) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.emailService = emailService;
        this.tokenRepository = tokenRepository;
        this.passwordResetTokenService = passwordResetTokenService;
        this.authenticationManager = authenticationManager;
        this.customUserService = customUserService;
    }

    @Override
    public void registerUser(AppUserRecord appUserRecord) {
        userRepository.findByEmail(appUserRecord.email())
                .ifPresent(user -> {
                    throw new IllegalArgumentException("Email already in use");
                });
        userRepository.findByUsername(appUserRecord.username())
                .ifPresent(user -> {
                    throw new IllegalArgumentException("Username already in use");
                });

        AppUserEntity user = new AppUserEntity();
        user.setPassword(passwordEncoder.encode(appUserRecord.password()));
        user.setRole(appUserRecord.role() == null ? Role.ADMIN : appUserRecord.role());
        user.setUsername(appUserRecord.username());
        user.setEmail(appUserRecord.email());
        user.setName(isBlank(appUserRecord.name()) ? appUserRecord.username() : appUserRecord.name());
        user.setCredentialsNonExpired(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setEnabled(false);

        userRepository.save(user);

        String token = jwtProvider.generateToken(user.getEmail(), List.of());

        CompletableFuture.runAsync(() ->
                emailService.sendAccountActivationEmail(appUserRecord.email(), token)
        );

//        user.setEnabled(false);

//        userRepository.save(user);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Override
    public void passwordResetRequest(NewPasswordRecord newPasswordRecord) {
        if (!Objects.equals(newPasswordRecord.newPassword(), newPasswordRecord.confirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        AppUserEntity userEntity = Converter.optionalToEntity(
                userRepository.findByUsernameAndEmail(newPasswordRecord.username(), newPasswordRecord.email())
        );

        if (userEntity == null) {
            throw new IllegalArgumentException("User not found");
        }

        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(userEntity);
        resetToken.setToken(token);
        resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(30));

        tokenRepository.save(resetToken);

        CompletableFuture.runAsync(() ->
                emailService.sendPasswordResetEmail(newPasswordRecord.email(), token)
        );
    }

    @Override
    public String authenticate(AppUserRecord dto) {
        // 1. Attempt authentication (will throw if user doesn't exist or password is wrong)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.username(), dto.password())
        );

        // 2. Load user details
        UserDetails userDetails = customUserService.loadUserByUsername(dto.username());

        // 3. Generate JWT token for authenticated user
        return jwtProvider.generateToken(userDetails.getUsername(), userDetails.getAuthorities());
    }

    @Override
    public AppUserRecord findUserById(Long userId) {
        Optional<AppUserEntity> user = userRepository.findById(userId);
        AppUserEntity userEntity = Converter.optionalToEntity(user);

        return new AppUserRecord(userEntity.getId(), userEntity.getUsername(), null, userEntity.getEmail(),
                userEntity.getName(), userEntity.getRole(), null, null);
    }

    @Override
    public void activateUser(AppUserRecord user) {
        AppUserEntity userEntity = Converter.optionalToEntity(userRepository.findByEmail(user.email()));
        userEntity.setEnabled(true);
        userRepository.save(userEntity);
    }

    @Override
    public AppUserRecord findUserByEmail(String email) {
        Optional<AppUserEntity> user = userRepository.findByEmail(email);
        AppUserEntity userEntity = Converter.optionalToEntity(user);
        return new AppUserRecord(userEntity.getId(), userEntity.getUsername(), null, userEntity.getEmail(),
                userEntity.getName(), userEntity.getRole(), null, null);
    }

    @Override
    public Boolean confirmPasswordReset(String token) {
        PasswordResetToken passwordResetToken = passwordResetTokenService.getPasswordResetToken(token);
        if (passwordResetToken == null) {
            return false;
        }

        String email = passwordResetToken.getUser().getEmail();
        if (email == null) {
            return false;
        }

        AppUserEntity userEntity = passwordResetToken.getUser();
        userEntity.setPassword(passwordEncoder.encode(userEntity.getPassword()));
        userRepository.save(userEntity);
        tokenRepository.delete(passwordResetToken);
        return true;
    }

    @Override
    public AppUserEntity findByUsername(String name) {
        Optional<AppUserEntity> user = userRepository.findByUsername(name);
        return Converter.optionalToEntity(user);
    }

    @Override
    public void deleteCollaborator(Long collaboratorId, Principal admin) {
        // Find the collaborator and verify they belong to the requesting admin
        AppUserEntity collaborator = userRepository.findByIdAndAdmin_Username(collaboratorId, admin.getName())
                .orElseThrow(() -> new IllegalArgumentException("Collaborator not found or does not belong to this admin"));

        // Additional security check: ensure the collaborator has COLLABORATOR role
        if (!Objects.equals(collaborator.getRole().toString(), "COLLABORATOR")) {
            throw new IllegalArgumentException("Cannot delete user: not a collaborator");
        }

        // Delete the collaborator
        userRepository.delete(collaborator);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public CheckUserResponse checkUserAvailability(CheckUserRequest request) {
        boolean emailExists = existsByEmail(request.email());
        boolean usernameExists = existsByUsername(request.username());
        
        boolean valid = !emailExists && !usernameExists;
        String message = valid ? "Username and email are available" :
                        (emailExists && usernameExists) ? "Both email and username are already taken" :
                        emailExists ? "Email is already taken" : "Username is already taken";
        
        return new CheckUserResponse(
            valid, 
            request.email(), 
            request.username(), 
            emailExists, 
            usernameExists, 
            message
        );
    }

}
