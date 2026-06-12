package za.co.email.service.config;

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
}
