package za.co.user.service.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.entity.PasswordResetToken;
import za.co.user.service.enums.Role;
import za.co.user.service.enums.AuthProvider;
import za.co.user.service.records.AppUserRecord;
import za.co.user.service.records.GoogleOAuthRequest;
import za.co.user.service.records.NewPasswordRecord;
import za.co.user.service.records.OAuthAccountResponse;
import za.co.user.service.records.RegisterUserRequest;
import za.co.user.service.repository.PasswordResetTokenRepository;
import za.co.user.service.repository.UserRepository;
import za.co.user.service.security.JwtProvider;
import za.co.user.service.service.CustomUserService;
import za.co.user.service.service.AccountActivationService;
import za.co.user.service.service.EmailNotificationPublisher;
import za.co.user.service.service.UserService;
import za.co.user.service.utilities.Converter;
import za.co.user.service.records.CheckUserRequest;   
import za.co.user.service.records.CheckUserResponse;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final AccountActivationService accountActivationService;
    private final EmailNotificationPublisher emailNotificationPublisher;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordResetTokenServiceImpl passwordResetTokenService;
    private final AuthenticationManager authenticationManager;
    private final CustomUserService customUserService;

    public UserServiceImpl(PasswordEncoder passwordEncoder, UserRepository userRepository, JwtProvider jwtProvider,
                           AccountActivationService accountActivationService,
                           EmailNotificationPublisher emailNotificationPublisher, PasswordResetTokenRepository tokenRepository,
                           PasswordResetTokenServiceImpl passwordResetTokenService,
                           AuthenticationManager authenticationManager, CustomUserService customUserService) {
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.jwtProvider = jwtProvider;
        this.accountActivationService = accountActivationService;
        this.emailNotificationPublisher = emailNotificationPublisher;
        this.tokenRepository = tokenRepository;
        this.passwordResetTokenService = passwordResetTokenService;
        this.authenticationManager = authenticationManager;
        this.customUserService = customUserService;
    }

    @Override
    @Transactional
    public void registerUser(RegisterUserRequest request) {
        userRepository.findByEmail(request.email())
                .ifPresent(user -> {
                    throw new IllegalArgumentException("Email already in use");
                });
        userRepository.findByUsername(request.username())
                .ifPresent(user -> {
                    throw new IllegalArgumentException("Username already in use");
                });

        AppUserEntity user = new AppUserEntity();
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setUsername(request.username());
        user.setEmail(request.email().trim().toLowerCase());
        user.setName(isBlank(request.name()) ? request.username() : request.name().trim());
        initializeNewAccount(user, AuthProvider.LOCAL, null);

        userRepository.save(user);
        sendActivationEmail(user);
    }

    @Override
    @Transactional
    public OAuthAccountResponse authenticateGoogleUser(GoogleOAuthRequest request) {
        if (!request.emailVerified()) {
            throw new IllegalArgumentException("Google has not verified this email address");
        }

        Optional<AppUserEntity> providerAccount = userRepository.findByAuthProviderAndProviderSubject(
                AuthProvider.GOOGLE,
                request.providerSubject()
        );
        if (providerAccount.isPresent()) {
            AppUserEntity user = providerAccount.get();
            if (!user.isEnabled()) {
                if (!accountActivationService.hasUsableToken(user)) {
                    sendActivationEmail(user);
                }
                return OAuthAccountResponse.pending(user.getUsername());
            }
            return OAuthAccountResponse.active(
                    user.getUsername(),
                    jwtProvider.generateToken(user.getUsername(), user.getAuthorities())
            );
        }

        String normalizedEmail = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new IllegalArgumentException(
                    "An account already exists for this email. Sign in using its original method."
            );
        }

        AppUserEntity user = new AppUserEntity();
        user.setEmail(normalizedEmail);
        user.setUsername(createAvailableUsername(normalizedEmail));
        user.setName(isBlank(request.name()) ? user.getUsername() : request.name().trim());
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        initializeNewAccount(user, AuthProvider.GOOGLE, request.providerSubject());
        userRepository.save(user);
        sendActivationEmail(user);
        return OAuthAccountResponse.pending(user.getUsername());
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @Override
    @Transactional
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

        emailNotificationPublisher.publishPasswordReset(newPasswordRecord.email(), token);
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

    private void initializeNewAccount(AppUserEntity user, AuthProvider authProvider, String providerSubject) {
        user.setRole(Role.ADMIN);
        user.setAuthProvider(authProvider);
        user.setProviderSubject(providerSubject);
        user.setCredentialsNonExpired(true);
        user.setAccountNonExpired(true);
        user.setAccountNonLocked(true);
        user.setEnabled(false);
    }

    private void sendActivationEmail(AppUserEntity user) {
        String token = accountActivationService.issueToken(user);
        emailNotificationPublisher.publishAccountActivation(user.getEmail(), token);
    }

    private String createAvailableUsername(String email) {
        String base = email.substring(0, email.indexOf('@'))
                .replaceAll("[^A-Za-z0-9._-]", "");
        if (base.length() < 3) {
            base = "user";
        }
        base = base.substring(0, Math.min(base.length(), 42));

        String candidate = base;
        int suffix = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "-" + suffix++;
        }
        return candidate;
    }

}
