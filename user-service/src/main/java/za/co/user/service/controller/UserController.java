package za.co.user.service.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus; 
import za.co.user.service.records.AppUserRecord;
import za.co.user.service.records.JwtResponseRecord;
import za.co.user.service.records.NewPasswordRecord;
import za.co.user.service.service.UserService;
import za.co.user.service.service.impl.UserServiceImpl;
import za.co.user.service.records.CheckUserRequest; 
import za.co.user.service.records.CheckUserResponse;
import jakarta.validation.Valid;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> registerUser(@RequestBody AppUserRecord registerRequest) {
        try {
            userService.registerUser(registerRequest);
            return ResponseEntity.ok(Map.of("message",
                    "Thank you for registering at NovaFlow. Please check your email to activate your account."));
        } catch (RuntimeException e) {
            if (Objects.equals(e.getMessage(), "User is disabled")) {
                return ResponseEntity.ok().body(Map.of("message",
                        "Thank you for registering at NovaFlow. Please check your email to activate your account."));
            }
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }

    }

    @PostMapping("/password/reset")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody NewPasswordRecord registerRequest) {
        try {
            userService.passwordResetRequest(registerRequest);
            return ResponseEntity.ok(Map.of("message", "User password reset was done successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AppUserRecord dto) {
        try {
            String jwt = userService.authenticate(dto);
            return ResponseEntity.ok(new JwtResponseRecord(jwt, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/check-registered")
    public ResponseEntity<CheckUserResponse> checkUserRegistered(@Valid @RequestBody CheckUserRequest request) {
        try {
            CheckUserResponse response = userService.checkUserAvailability(request);
            return ResponseEntity.ok(response);
            
        } catch (RuntimeException e) {
            CheckUserResponse errorResponse = new CheckUserResponse(
                false, 
                request.email(), 
                request.username(), 
                false, 
                false, 
                "Unable to check availability at this time"
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}

