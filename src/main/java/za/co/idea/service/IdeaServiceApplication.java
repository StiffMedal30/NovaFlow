package za.co.idea.service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class IdeaServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(IdeaServiceApplication.class, args);
	}

}
