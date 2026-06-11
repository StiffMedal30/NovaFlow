package za.co.novaflow.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT,
        properties = {
                "eureka.client.enabled=false", // Disable Eureka client
                "spring.cloud.config.enabled=false" // Optionally disable Spring Cloud Config if not needed
        }
)
class ConfigApplicationTests {

    @Value("${spring.cloud.config.server.git.uri}")
    private String gitUri;

    @Value("${server.port}")
    private int serverPort;

    @Test
    void gitUriIsAccessibleAndValid() {
        assertThat(gitUri).isNotNull();
        assertThat(gitUri).startsWith("https://");
        assertThat(gitUri).contains("github.com");
    }

    @Test
    void serverPortIsConfiguredCorrectly() {
        assertThat(serverPort).isEqualTo(7090);
    }
}
