package za.co.email.service.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;
import za.co.novaflow.notification.EmailNotification;
import za.co.novaflow.notification.EmailNotificationType;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

@Tag("integration")
@Testcontainers
@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "eureka.client.enabled=false",
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
class EmailDeliveryIntegrationTests {

    private static final String EMAIL_EXCHANGE = "novaflow.notifications";
    private static final String EMAIL_ROUTING_KEY = "email.send";
    private static final String EMAIL_QUEUE = "novaflow.email.delivery";
    private static final String DEAD_LETTER_QUEUE = "novaflow.email.delivery.dlq";

    @Container
    static final RabbitMQContainer RABBITMQ =
            new RabbitMQContainer("rabbitmq:3.13-management");

    @Container
    static final GenericContainer<?> MAILPIT =
            new GenericContainer<>(DockerImageName.parse("axllent/mailpit:v1.30.1"))
                    .withExposedPorts(1025, 8025)
                    .waitingFor(Wait.forHttp("/api/v1/messages").forPort(8025));

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", RABBITMQ::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "guest");
        registry.add("spring.rabbitmq.password", () -> "guest");
        registry.add("spring.mail.host", MAILPIT::getHost);
        registry.add("spring.mail.port", () -> MAILPIT.getMappedPort(1025));
        registry.add("spring.mail.properties.mail.smtp.auth", () -> false);
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> false);
    }

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitAdmin rabbitAdmin;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @BeforeEach
    void purgeQueues() {
        rabbitAdmin.purgeQueue(EMAIL_QUEUE, false);
        rabbitAdmin.purgeQueue(DEAD_LETTER_QUEUE, false);
    }

    @Test
    void consumesNotificationAndDeliversEmailThroughSmtp() {
        EmailNotification notification = EmailNotification.create(
                EmailNotificationType.ACCOUNT_ACTIVATION,
                "integration-user@example.com",
                "activation-token"
        );

        rabbitTemplate.convertAndSend(EMAIL_EXCHANGE, EMAIL_ROUTING_KEY, notification);

        await().atMost(Duration.ofSeconds(15)).untilAsserted(() -> {
            JsonNode messages = mailpitMessages();
            assertThat(messages.path("total").asInt()).isEqualTo(1);

            JsonNode message = messages.path("messages").get(0);
            assertThat(message.path("Subject").asText())
                    .isEqualTo("Verify your NovaFlow account");
            assertThat(message.path("To").get(0).path("Address").asText())
                    .isEqualTo("integration-user@example.com");
            assertThat(message.path("Snippet").asText())
                    .contains("Activate Account");
        });

        assertThat(rabbitAdmin.getQueueInfo(DEAD_LETTER_QUEUE).getMessageCount()).isZero();
    }

    private JsonNode mailpitMessages() throws Exception {
        URI uri = URI.create(
                "http://" + MAILPIT.getHost() + ":" + MAILPIT.getMappedPort(8025) + "/api/v1/messages"
        );
        HttpRequest request = HttpRequest.newBuilder(uri).GET().build();
        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertThat(response.statusCode()).isEqualTo(200);
        return objectMapper.readTree(response.body());
    }
}
