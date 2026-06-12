package za.co.user.service.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import za.co.user.service.enums.ActivationStatus;
import za.co.user.service.service.AccountActivationService;
import za.co.user.service.service.UserService;

@RestController
@RequestMapping("/api/link/redirect")
public class LinkRedirectController {

    private final UserService userService;
    private final AccountActivationService accountActivationService;

    public LinkRedirectController(UserService userService, AccountActivationService accountActivationService) {
        this.userService = userService;
        this.accountActivationService = accountActivationService;
    }

    @GetMapping("/activate")
    public ResponseEntity<String> activateAccount(@RequestParam("t") String token) {
        ActivationStatus status = accountActivationService.activate(token);
        return switch (status) {
            case ACTIVATED -> ResponseEntity.ok("User activated successfully.");
            case INVALID -> ResponseEntity.badRequest().body("Invalid activation link.");
            case EXPIRED -> ResponseEntity.status(HttpStatus.GONE).body("Activation link has expired.");
            case USED -> ResponseEntity.status(HttpStatus.GONE).body("Activation link has already been used.");
        };
    }

    @GetMapping("/reset/password")
    public ResponseEntity<String> resetPassword(@RequestParam("t") String token) {
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

