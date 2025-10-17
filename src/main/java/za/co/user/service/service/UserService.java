package za.co.user.service.service;

import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.records.AppUserRecord;
import za.co.user.service.records.NewPasswordRecord;
import za.co.user.service.records.CheckUserRequest;  
import za.co.user.service.records.CheckUserResponse;  

import java.security.Principal;

public interface UserService {
    void registerUser(AppUserRecord dto);

    void passwordResetRequest(NewPasswordRecord dto);

    String authenticate(AppUserRecord dto);

    AppUserRecord findUserById(Long userId);

    void activateUser(AppUserRecord user);

    AppUserRecord findUserByEmail(String email);

    Boolean confirmPasswordReset(String token);

    AppUserEntity findByUsername(String name);

    void deleteCollaborator(Long collaboratorId, Principal admin);

    // Check if email or username is already registered
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    CheckUserResponse checkUserAvailability(CheckUserRequest request);
}
