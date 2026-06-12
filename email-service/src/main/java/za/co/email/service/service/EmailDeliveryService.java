package za.co.email.service.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import za.co.email.service.config.MailProperties;
import za.co.novaflow.notification.EmailNotification;

import java.io.UnsupportedEncodingException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class EmailDeliveryService {

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    public void send(EmailNotification notification) {
        EmailContent content = contentFor(notification);
        String redirectUrl = createEncodedRedirectUrl(notification.token(), content.actionUrl());
        String html = content.htmlTemplate().replace("%s", redirectUrl);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, StandardCharsets.UTF_8.name());
            helper.setTo(notification.recipient());
            helper.setFrom(mailProperties.getFromAddress(), mailProperties.getFromName());
            helper.setSubject(content.subject());
            helper.setText(html, true);
            mailSender.send(message);
        } catch (MessagingException | UnsupportedEncodingException exception) {
            throw new IllegalStateException(
                    "Failed to send email notification " + notification.messageId(),
                    exception
            );
        }
    }

    private EmailContent contentFor(EmailNotification notification) {
        return switch (notification.type()) {
            case ACCOUNT_ACTIVATION -> new EmailContent(
                    mailProperties.getActivateAccountSubject(),
                    mailProperties.getActivateAccountMessageBody(),
                    mailProperties.getAccountActivationUrl()
            );
            case PASSWORD_RESET -> new EmailContent(
                    mailProperties.getResetPasswordSubject(),
                    mailProperties.getResetPasswordMessageBody(),
                    mailProperties.getResetPasswordUrl()
            );
            case COLLABORATOR_INVITATION -> new EmailContent(
                    mailProperties.getInvitationSubject(),
                    mailProperties.getInvitationMessageBody(),
                    mailProperties.getCollaboratorInviteUrl()
            );
        };
    }

    private String createEncodedRedirectUrl(String token, String actionUrl) {
        String target = actionUrl + "?token=" + token;
        String encoded = Base64.getUrlEncoder()
                .encodeToString(target.getBytes(StandardCharsets.UTF_8));
        return mailProperties.getBaseRedirectUrl() + encoded;
    }

    private record EmailContent(String subject, String htmlTemplate, String actionUrl) {
    }
}
