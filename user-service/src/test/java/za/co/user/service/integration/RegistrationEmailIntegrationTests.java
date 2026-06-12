package za.co.user.service.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.containers.RabbitMQContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import za.co.novaflow.notification.EmailNotification;
import za.co.novaflow.notification.EmailNotificationType;
import za.co.user.service.repository.UserRepository;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Tag("integration")
@Testcontainers
@SpringBootTest(properties = {
        "spring.cloud.config.enabled=false",
        "spring.cloud.discovery.enabled=false",
        "eureka.client.enabled=false",
        "spring.rabbitmq.listener.simple.auto-startup=false",
        "spring.liquibase.change-log=classpath:db/db.changelog-master.yml",
        "spring.jpa.hibernate.ddl-auto=none",
        "jwt.secret=integration-test-secret-integration-test-secret-integration-test-secret",
        "jwt.expiration=3600000"
})
@AutoConfigureMockMvc
class RegistrationEmailIntegrationTests {

    private static final String EMAIL_QUEUE = "novaflow.email.delivery";

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:15");

    @Container
    static final RabbitMQContainer RABBITMQ =
            new RabbitMQContainer("rabbitmq:3.13-management");

    @DynamicPropertySource
    static void containerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.rabbitmq.host", RABBITMQ::getHost);
        registry.add("spring.rabbitmq.port", RABBITMQ::getAmqpPort);
        registry.add("spring.rabbitmq.username", () -> "guest");
        registry.add("spring.rabbitmq.password", () -> "guest");
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Autowired
    private RabbitAdmin rabbitAdmin;

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void purgeEmailQueue() {
        rabbitAdmin.purgeQueue(EMAIL_QUEUE, false);
    }

    @Test
    void registrationPersistsUserAndPublishesActivationEmail() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "integration-" + suffix;
        String email = username + "@example.com";
        Map<String, Object> request = Map.of(
                "username", username,
                "password", "StrongPassword123!",
                "email", email,
                "name", "Integration User",
                "role", "ADMIN"
        );

        mockMvc.perform(post("/api/user/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk());

        assertThat(userRepository.findByEmail(email))
                .isPresent()
                .get()
                .satisfies(user -> {
                    assertThat(user.getUsername()).isEqualTo(username);
                    assertThat(user.isEnabled()).isFalse();
                });

        AtomicReference<EmailNotification> received = new AtomicReference<>();
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            Object message = rabbitTemplate.receiveAndConvert(EMAIL_QUEUE, 500);
            assertThat(message).isInstanceOf(EmailNotification.class);
            received.set((EmailNotification) message);
        });

        assertThat(received.get()).satisfies(notification -> {
            assertThat(notification.type()).isEqualTo(EmailNotificationType.ACCOUNT_ACTIVATION);
            assertThat(notification.recipient()).isEqualTo(email);
            assertThat(notification.token()).isNotBlank();
            assertThat(notification.messageId()).isNotNull();
            assertThat(notification.requestedAt()).isNotNull();
        });
    }
}
