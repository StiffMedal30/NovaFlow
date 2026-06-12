package za.co.email.service.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import za.co.novaflow.notification.EmailNotification;
import za.co.novaflow.notification.EmailNotificationType;

import java.io.IOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@Tag("integration")
@Testcontainers
@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "eureka.client.enabled=false",
        "spring.rabbitmq.listener.simple.default-requeue-rejected=false",
        "spring.rabbitmq.listener.simple.retry.enabled=true",
        "spring.rabbitmq.listener.simple.retry.initial-interval=100ms",
        "spring.rabbitmq.listener.simple.retry.max-attempts=3",
        "spring.rabbitmq.listener.simple.retry.max-interval=100ms",
        "spring.rabbitmq.listener.simple.retry.multiplier=1",
        "spring.mail.properties.mail.smtp.connectiontimeout=1000",
        "spring.mail.properties.mail.smtp.timeout=1000",
        "spring.mail.properties.mail.smtp.writetimeout=1000",
        "app.mail.from-address=no-reply@novaflow.local",
        "app.mail.from-name=NovaFlow",
        "app.mail.base-redirect-url=http://localhost:8081/api/link?t=",
        "app.mail.account-activation-url=http://localhost:8081/api/account/activate",
        "app.mail.reset-password-url=http://localhost:8081/api/password/reset",
        "app.mail.collaborator-invite-url=http://localhost:8081/api/invite",
        "app.mail.activate-account-subject=Verify your NovaFlow account",
        "app.mail.activate-account-message-body=<a href=\"%s\">Activate Account</a>",
        "app.mail.reset-password-subject=Reset your NovaFlow password",
        "app.mail.reset-password-message-body=<a href=\"%s\">Reset Password</a>",
        "app.mail.invitation-subject=NovaFlow account invitation",
        "app.mail.invitation-message-body=<a href=\"%s\">Accept Invitation</a>"
})
class EmailDeadLetterIntegrationTests {

    private static final String EMAIL_EXCHANGE = "novaflow.notifications";
    private static final String EMAIL_ROUTING_KEY = "email.send";
    private static final String EMAIL_QUEUE = "novaflow.email.delivery";
    private static final String DEAD_LETTER_QUEUE = "novaflow.email.delivery.dlq";
    private static final RejectingSmtpServer REJECTING_SMTP = new RejectingSmtpServer();

    @Container
    static final RabbitMQContainer RABBITMQ =
            new RabbitMQContainer("rabbitmq:3.13-management");

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", RABBITMQ::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "guest");
        registry.add("spring.rabbitmq.password", () -> "guest");
        registry.add("spring.mail.host", () -> "127.0.0.1");
        registry.add("spring.mail.port", REJECTING_SMTP::port);
        registry.add("spring.mail.properties.mail.smtp.auth", () -> false);
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> false);
    }

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitAdmin rabbitAdmin;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    void resetTestState() {
        rabbitAdmin.purgeQueue(EMAIL_QUEUE, false);
        rabbitAdmin.purgeQueue(DEAD_LETTER_QUEUE, false);
        REJECTING_SMTP.resetAttempts();
    }

    @AfterAll
    static void stopRejectingSmtpServer() {
        REJECTING_SMTP.close();
    }

    @Test
    void retriesFailedSmtpDeliveryThenDeadLettersOriginalNotification() throws Exception {
        EmailNotification notification = EmailNotification.create(
                EmailNotificationType.PASSWORD_RESET,
                "failed-delivery@example.com",
                "reset-token"
        );

        rabbitTemplate.convertAndSend(EMAIL_EXCHANGE, EMAIL_ROUTING_KEY, notification);

        AtomicReference<Message> deadLetter = new AtomicReference<>();
        await().atMost(Duration.ofSeconds(15)).untilAsserted(() -> {
            Message message = rabbitTemplate.receive(DEAD_LETTER_QUEUE, 500);
            assertThat(message).isNotNull();
            deadLetter.set(message);
        });

        await().atMost(Duration.ofSeconds(5))
                .untilAsserted(() -> assertThat(REJECTING_SMTP.attempts()).isEqualTo(3));

        EmailNotification rejected =
                objectMapper.readValue(deadLetter.get().getBody(), EmailNotification.class);
        assertThat(rejected.messageId()).isEqualTo(notification.messageId());
        assertThat(rejected.type()).isEqualTo(EmailNotificationType.PASSWORD_RESET);
        assertThat(rejected.recipient()).isEqualTo("failed-delivery@example.com");
        assertThat(deadLetter.get().getMessageProperties().getHeaders())
                .containsKey("x-death");
    }

    private static final class RejectingSmtpServer implements AutoCloseable {

        private final ServerSocket serverSocket;
        private final AtomicBoolean running = new AtomicBoolean(true);
        private final AtomicInteger attempts = new AtomicInteger();
        private final Thread acceptThread;

        private RejectingSmtpServer() {
            try {
                serverSocket = new ServerSocket(0, 50, InetAddress.getLoopbackAddress());
            } catch (IOException exception) {
                throw new ExceptionInInitializerError(exception);
            }

            acceptThread = new Thread(this::rejectConnections, "rejecting-smtp-server");
            acceptThread.setDaemon(true);
            acceptThread.start();
        }

        private void rejectConnections() {
            while (running.get()) {
                try (Socket ignored = serverSocket.accept()) {
                    attempts.incrementAndGet();
                } catch (IOException exception) {
                    if (running.get()) {
                        throw new IllegalStateException("Rejecting SMTP server failed", exception);
                    }
                }
            }
        }

        private int port() {
            return serverSocket.getLocalPort();
        }

        private int attempts() {
            return attempts.get();
        }

        private void resetAttempts() {
            attempts.set(0);
        }

        @Override
        public void close() {
            running.set(false);
            try {
                serverSocket.close();
                acceptThread.join(Duration.ofSeconds(2).toMillis());
            } catch (IOException exception) {
                throw new IllegalStateException("Could not close rejecting SMTP server", exception);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("Interrupted while closing rejecting SMTP server", exception);
            }
        }
    }
}
