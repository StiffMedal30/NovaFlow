package za.co.user.service.service.impl;

import org.springframework.stereotype.Service;
import za.co.user.service.entity.AppUserEntity;
import za.co.user.service.entity.InvitationTokenEntity;
import za.co.user.service.records.InviteRequestRecord;
import za.co.user.service.repository.InvitationTokenRepository;
import za.co.user.service.repository.UserRepository;
import za.co.user.service.service.EmailService;
import za.co.user.service.service.InvitationService;
import za.co.user.service.utilities.Converter;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class InvitationServiceImpl implements InvitationService {

    private final UserRepository userRepository;
    private final InvitationTokenRepository tokenRepository;
    private final EmailService emailService;

    public InvitationServiceImpl(UserRepository userRepository, InvitationTokenRepository tokenRepository, EmailService emailService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.emailService = emailService;
    }

    @Override
    public void sendInvitation(InviteRequestRecord inviteRequest, Principal principal) {
        AppUserEntity admin = Converter.optionalToEntity(userRepository.findByUsername(principal.getName()));
        String token = UUID.randomUUID().toString();

        InvitationTokenEntity invitationToken = new InvitationTokenEntity();
        invitationToken.setToken(token);
        invitationToken.setEmail(inviteRequest.email());
        invitationToken.setAdmin(admin);
        invitationToken.setExpiryDate(LocalDateTime.now().plusHours(24));
        invitationToken.setUsed(false);

        tokenRepository.save(invitationToken);

        CompletableFuture.runAsync(() ->
                emailService.sendInvitationEmail(inviteRequest.email(), token)
        );
    }

    @Override
    public InvitationTokenEntity validateToken(String token) {
        return null;
    }

    @Override
    public void markTokenUsed(String token) {

    }
}
