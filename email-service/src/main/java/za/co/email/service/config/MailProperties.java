package za.co.email.service.config;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.mail")
public class MailProperties {
    private String fromAddress;
    private String fromName;
    private String baseRedirectUrl;
    private String accountActivationUrl;
    private String resetPasswordUrl;
    private String collaboratorInviteUrl;
    private String activateAccountSubject;
    private String activateAccountMessageBody;
    private String resetPasswordSubject;
    private String resetPasswordMessageBody;
    private String invitationSubject;
    private String invitationMessageBody;

    @PostConstruct
    void validate() {
        requireText(fromAddress, "app.mail.from-address");
        requireText(fromName, "app.mail.from-name");
        requireText(baseRedirectUrl, "app.mail.base-redirect-url");
        requireText(accountActivationUrl, "app.mail.account-activation-url");
        requireText(resetPasswordUrl, "app.mail.reset-password-url");
        requireText(collaboratorInviteUrl, "app.mail.collaborator-invite-url");
        requireText(activateAccountSubject, "app.mail.activate-account-subject");
        requireText(activateAccountMessageBody, "app.mail.activate-account-message-body");
        requireText(resetPasswordSubject, "app.mail.reset-password-subject");
        requireText(resetPasswordMessageBody, "app.mail.reset-password-message-body");
        requireText(invitationSubject, "app.mail.invitation-subject");
        requireText(invitationMessageBody, "app.mail.invitation-message-body");
    }

    private void requireText(String value, String property) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Missing required email configuration: " + property);
        }
    }
}
