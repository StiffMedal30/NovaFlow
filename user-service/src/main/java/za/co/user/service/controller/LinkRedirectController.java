package za.co.user.service.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.co.user.service.records.AppUserRecord;
import za.co.user.service.security.JwtProvider;
import za.co.user.service.service.UserService;

import java.io.IOException;

@RestController
@RequestMapping("/api/link/redirect")
public class LinkRedirectController {

    private final UserService userService;
    private final JwtProvider jwtTokenProvider;

    public LinkRedirectController(UserService userService, JwtProvider jwtTokenProvider) {
        this.userService = userService;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @GetMapping("/activate")
    public ResponseEntity<String> activateAccount(@RequestParam("t") String token, HttpServletResponse response) throws IOException {
        try {
            // Step 1: Decode and validate the token.
            String email = jwtTokenProvider.getEmailFromToken(token);
            if (email == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid token.");
            }

            // Step 2: Find the user using the extracted user ID.
            AppUserRecord user = userService.findUserByEmail(email);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found.");
            }

            // Step 3: Activate the user.
            userService.activateUser(user);

            return ResponseEntity.ok("User activated successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Activation failed: " + e.getMessage());
        }
    }

    @GetMapping("/reset/password")
    public ResponseEntity<String> resetPassword(@RequestParam("t") String token, HttpServletResponse response) throws IOException {
        try {
            Boolean success = userService.confirmPasswordReset(token);
            if (!success) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Password reset failed.");
            }

            return ResponseEntity.ok("Password reset successfully.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Password reset failed: " + e.getMessage());
        }
    }
}

