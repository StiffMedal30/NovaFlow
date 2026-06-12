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
import za.co.user.service.entity.AccountActivationToken;
import za.co.user.service.enums.AuthProvider;
import za.co.user.service.repository.AccountActivationTokenRepository;
import za.co.user.service.repository.UserRepository;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    @Autowired
    private AccountActivationTokenRepository activationTokenRepository;

    @BeforeEach
    void purgeEmailQueue() {
        rabbitAdmin.purgeQueue(EMAIL_QUEUE, false);
    }

    @Test
    void manualRegistrationRequiresSingleUseActivation() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "integration-" + suffix;
        String email = username + "@example.com";
        Map<String, Object> request = Map.of(
                "username", username,
                "password", "StrongPassword123!",
                "email", email,
                "name", "Integration User"
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
        login(username, status().isBadRequest());

        EmailNotification notification = receiveEmail();
        assertThat(notification).satisfies(message -> {
            assertThat(message.type()).isEqualTo(EmailNotificationType.ACCOUNT_ACTIVATION);
            assertThat(message.recipient()).isEqualTo(email);
            assertThat(message.token()).isNotBlank();
            assertThat(message.messageId()).isNotNull();
            assertThat(message.requestedAt()).isNotNull();
        });

        mockMvc.perform(get("/api/link/redirect/activate")
                        .queryParam("t", notification.token()))
                .andExpect(status().isOk());

        assertThat(userRepository.findByEmail(email))
                .isPresent()
                .get()
                .extracting(user -> user.isEnabled())
                .isEqualTo(true);
        login(username, status().isOk());

        mockMvc.perform(get("/api/link/redirect/activate")
                        .queryParam("t", notification.token()))
                .andExpect(status().isGone());
    }

    @Test
    void expiredActivationLinkCannotEnableAccount() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "expired-" + suffix;
        String email = username + "@example.com";

        register(username, email);
        EmailNotification notification = receiveEmail();

        var user = userRepository.findByEmail(email).orElseThrow();
        AccountActivationToken token = activationTokenRepository.findByUser(user).orElseThrow();
        token.setExpiryDate(LocalDateTime.now().minusMinutes(1));
        activationTokenRepository.saveAndFlush(token);

        mockMvc.perform(get("/api/link/redirect/activate")
                        .queryParam("t", notification.token()))
                .andExpect(status().isGone());

        assertThat(userRepository.findByEmail(email).orElseThrow().isEnabled()).isFalse();
    }

    @Test
    void firstGoogleLoginCreatesDisabledAccountAndPublishesActivationEmail() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String email = "google-" + suffix + "@example.com";
        Map<String, Object> request = Map.of(
                "providerSubject", "google-subject-" + suffix,
                "email", email,
                "name", "Google User",
                "emailVerified", true
        );

        String response = mockMvc.perform(post("/api/user/oauth/google")
                        .header("X-Internal-Service-Key", "integration-internal-key")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(objectMapper.readTree(response).path("status").asText())
                .isEqualTo("PENDING_ACTIVATION");
        assertThat(userRepository.findByEmail(email))
                .isPresent()
                .get()
                .satisfies(user -> {
                    assertThat(user.isEnabled()).isFalse();
                    assertThat(user.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);
                    assertThat(user.getProviderSubject()).isEqualTo("google-subject-" + suffix);
                });
        assertThat(receiveEmail().recipient()).isEqualTo(email);
    }

    private void register(String username, String email) throws Exception {
        Map<String, Object> request = Map.of(
                "username", username,
                "password", "StrongPassword123!",
                "email", email,
                "name", "Integration User"
        );

        mockMvc.perform(post("/api/user/register")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andExpect(status().isOk());
    }

    private void login(
            String username,
            org.springframework.test.web.servlet.ResultMatcher expectedStatus
    ) throws Exception {
        mockMvc.perform(post("/api/user/login")
                        .contentType(APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(Map.of(
                                "username", username,
                                "password", "StrongPassword123!"
                        ))))
                .andExpect(expectedStatus);
    }

    private EmailNotification receiveEmail() {
        AtomicReference<EmailNotification> received = new AtomicReference<>();
        await().atMost(Duration.ofSeconds(10)).untilAsserted(() -> {
            Object message = rabbitTemplate.receiveAndConvert(EMAIL_QUEUE, 500);
            assertThat(message).isInstanceOf(EmailNotification.class);
            received.set((EmailNotification) message);
        });
        return received.get();
    }
}
