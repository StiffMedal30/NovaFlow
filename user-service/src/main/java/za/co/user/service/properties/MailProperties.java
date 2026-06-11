package za.co.user.service.properties;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.mail")
@Getter
@Setter
public class MailProperties {
    private String baseRedirectUrl;
    private String accountActivationUrl;
    private String resetPasswordUrl;
    private String collaboratorInviteUrl;
    private String activateAccountMessageBody;
    private String resetPasswordMessageBody;
    private String invitationMessageBody;
}

