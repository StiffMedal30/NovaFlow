package za.co.user.service.service;

import za.co.user.service.entity.InvitationTokenEntity;
import za.co.user.service.records.InviteRequestRecord;

import java.security.Principal;

public interface InvitationService {
    void sendInvitation(InviteRequestRecord inviteRequest, Principal principal);
    InvitationTokenEntity validateToken(String token);
    void markTokenUsed(String token);
}
