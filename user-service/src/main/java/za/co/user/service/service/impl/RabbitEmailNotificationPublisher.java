package za.co.user.service.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import za.co.novaflow.notification.EmailNotification;
import za.co.novaflow.notification.EmailNotificationType;
import za.co.user.service.config.EmailMessagingProperties;
import za.co.user.service.service.EmailNotificationPublisher;

@Service
@RequiredArgsConstructor
public class RabbitEmailNotificationPublisher implements EmailNotificationPublisher {

    private final RabbitTemplate rabbitTemplate;
    private final EmailMessagingProperties properties;

    @Override
    public void publishAccountActivation(String recipient, String token) {
        publish(EmailNotificationType.ACCOUNT_ACTIVATION, recipient, token);
    }

    @Override
    public void publishPasswordReset(String recipient, String token) {
        publish(EmailNotificationType.PASSWORD_RESET, recipient, token);
    }

    @Override
    public void publishInvitation(String recipient, String token) {
        publish(EmailNotificationType.COLLABORATOR_INVITATION, recipient, token);
    }

    private void publish(EmailNotificationType type, String recipient, String token) {
        EmailNotification notification = EmailNotification.create(type, recipient, token);
        rabbitTemplate.convertAndSend(
                properties.exchange(),
                properties.routingKey(),
                notification,
                message -> {
                    message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                    message.getMessageProperties().setMessageId(notification.messageId().toString());
                    return message;
                }
        );
    }
}
