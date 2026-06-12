package za.co.user.service.service.impl;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import za.co.novaflow.notification.EmailNotification;
import za.co.novaflow.notification.EmailNotificationType;
import za.co.user.service.config.EmailMessagingProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class RabbitEmailNotificationPublisherTests {

    @Test
    void publishesPasswordResetNotification() {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        EmailMessagingProperties properties = new EmailMessagingProperties(
                "novaflow.notifications",
                "novaflow.email.delivery",
                "email.send",
                "novaflow.notifications.dlx",
                "novaflow.email.delivery.dlq",
                "email.failed"
        );
        RabbitEmailNotificationPublisher publisher =
                new RabbitEmailNotificationPublisher(rabbitTemplate, properties);

        publisher.publishPasswordReset("user@example.com", "reset-token");

        ArgumentCaptor<Object> notificationCaptor = ArgumentCaptor.forClass(Object.class);
        verify(rabbitTemplate).convertAndSend(
                eq("novaflow.notifications"),
                eq("email.send"),
                notificationCaptor.capture(),
                any(MessagePostProcessor.class)
        );

        EmailNotification notification = (EmailNotification) notificationCaptor.getValue();
        assertThat(notification.type()).isEqualTo(EmailNotificationType.PASSWORD_RESET);
        assertThat(notification.recipient()).isEqualTo("user@example.com");
        assertThat(notification.token()).isEqualTo("reset-token");
        assertThat(notification.messageId()).isNotNull();
        assertThat(notification.requestedAt()).isNotNull();
    }
}
