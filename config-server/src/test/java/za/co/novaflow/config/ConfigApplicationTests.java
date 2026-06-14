package za.co.novaflow.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "eureka.client.enabled=false",
                "spring.cloud.discovery.enabled=false"
        }
)
class ConfigApplicationTests {

    @Value("${spring.cloud.config.server.native.search-locations}")
    private String searchLocations;

    @Value("${server.port}")
    private int serverPort;

    @Test
    void nativeConfigLocationIsConfigured() {
        assertThat(searchLocations)
                .isNotBlank()
                .contains("common-config");
    }

    @Test
    void serverPortIsConfiguredCorrectly() {
        assertThat(serverPort).isEqualTo(7090);
    }
}
