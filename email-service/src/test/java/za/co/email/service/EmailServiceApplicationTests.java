package za.co.email.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"eureka.client.enabled=false",
		"spring.cloud.discovery.enabled=false",
		"spring.cloud.config.enabled=false"
})
class EmailServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
