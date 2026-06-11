package za.co.novaflow.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false",
                "spring.cloud.config.server.git.clone-on-start=false"
        }
)
class ConfigApplicationTests {

    @Value("${spring.cloud.config.server.git.uri}")
    private String gitUri;

    @Value("${server.port}")
    private int serverPort;

    @Test
    void gitUriIsConfigured() {
        assertThat(gitUri)
                .isNotBlank()
                .endsWith("common-config.git");
    }

    @Test
    void serverPortIsConfiguredCorrectly() {
        assertThat(serverPort).isEqualTo(7090);
    }
}
