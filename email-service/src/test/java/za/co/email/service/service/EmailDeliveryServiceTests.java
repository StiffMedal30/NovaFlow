package za.co.email.service.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.javamail.JavaMailSender;
import za.co.email.service.config.MailProperties;
import za.co.novaflow.notification.EmailNotification;
import za.co.novaflow.notification.EmailNotificationType;

import java.time.Instant;
import java.util.Properties;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailDeliveryServiceTests {

    private JavaMailSender mailSender;
    private EmailDeliveryService emailDeliveryService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        MailProperties properties = new MailProperties();
        properties.setFromAddress("no-reply@novaflow.local");
        properties.setFromName("NovaFlow");
        properties.setBaseRedirectUrl("http://localhost:8081/api/link?t=");
        properties.setAccountActivationUrl("http://localhost:8081/api/account/activate");
        properties.setActivateAccountSubject("Activate account");
        properties.setActivateAccountMessageBody(
                "<table style=\"width:100%\"><tr><td><a href=\"%s\">Activate</a></td></tr></table>"
        );

        emailDeliveryService = new EmailDeliveryService(mailSender, properties);
    }

    @Test
    void sendsAccountActivationEmailFromNotification() throws Exception {
        MimeMessage message = new MimeMessage(Session.getInstance(new Properties()));
        when(mailSender.createMimeMessage()).thenReturn(message);

        EmailNotification notification = new EmailNotification(
                UUID.randomUUID(),
                EmailNotificationType.ACCOUNT_ACTIVATION,
                "new-user@example.com",
                "activation-token",
                Instant.now()
        );

        emailDeliveryService.send(notification);

        ArgumentCaptor<MimeMessage> messageCaptor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(mailSender).send(messageCaptor.capture());
        MimeMessage sentMessage = messageCaptor.getValue();
        assertThat(sentMessage.getAllRecipients()[0].toString()).isEqualTo("new-user@example.com");
        assertThat(sentMessage.getSubject()).isEqualTo("Activate account");
        assertThat(sentMessage.getContent().toString())
                .contains("http://localhost:8081/api/link?t=");
    }
}
