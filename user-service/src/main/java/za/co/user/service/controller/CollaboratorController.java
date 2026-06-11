package za.co.user.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.user.service.records.InviteRequestRecord;
import za.co.user.service.service.InvitationService;
import za.co.user.service.service.UserService;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/collaborator")
@AllArgsConstructor
public class CollaboratorController {

    private final InvitationService invitationService;
    private final UserService userService;

    @PostMapping("/invite")
    public ResponseEntity<Map<String, String>> inviteCollaborator(@RequestBody InviteRequestRecord inviteRequest, Principal principal) {
        try {
            invitationService.sendInvitation(inviteRequest, principal);
            return ResponseEntity.ok(Map.of("message", "Invitation sent successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/delete/{collaboratorId}")
    public ResponseEntity<Map<String, String>> deleteCollaborator(@PathVariable Long collaboratorId, Principal principal) {
        try {
            userService.deleteCollaborator(collaboratorId, principal);
            return ResponseEntity.ok(Map.of("message", "Collaborator deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
