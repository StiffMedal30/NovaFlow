package za.co.email.service.messaging;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import za.co.email.service.service.EmailDeliveryService;
import za.co.novaflow.notification.EmailNotification;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailNotificationListener {

    private final EmailDeliveryService emailDeliveryService;

    @RabbitListener(queues = "${app.messaging.email.queue}")
    public void handle(EmailNotification notification) {
        log.info("Processing {} email notification {}", notification.type(), notification.messageId());
        emailDeliveryService.send(notification);
    }
}
