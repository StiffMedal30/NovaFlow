package za.co.api.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.api.gateway.records.CheckUserRequest;
import za.co.api.gateway.records.LoginRequest;
import za.co.api.gateway.records.PasswordResetRequest;
import za.co.api.gateway.records.RegisterUserRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController extends BaseController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest credentials) {
        try {
            return forwardPostRequest(USER_SERVICE + "/login", credentials);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterUserRequest newUser) {
        try {
            return forwardPostRequest(USER_SERVICE + "/register", newUser);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

    @PostMapping("/password/reset")
    public ResponseEntity<?> resetPassword(@RequestBody PasswordResetRequest newCredentials) {
        try {
            return forwardPostRequest(USER_SERVICE + "/password/reset", newCredentials);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Reset failed: " + e.getMessage()));
        }
    }

    @PostMapping("/check-registered")
    public ResponseEntity<?> checkRegister(@RequestBody CheckUserRequest user) {
        try {
            return forwardPostRequest(USER_SERVICE + "/check-registered", user);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Check registration failed: " + e.getMessage()));
        }
    }
}
