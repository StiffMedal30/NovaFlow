package za.co.api.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.api.gateway.records.InviteRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/collaborator")
public class CollaboratorController extends BaseController {

    @PostMapping("/invite")
    public ResponseEntity<?> invite(@RequestBody InviteRequest credentials) {
        try {
            return forwardPostRequest(collaboratorService + "/invite", credentials);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Registration failed: " + e.getMessage()));
        }
    }

}
