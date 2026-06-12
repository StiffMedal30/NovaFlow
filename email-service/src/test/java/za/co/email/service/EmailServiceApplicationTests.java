package za.co.email.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
		"eureka.client.enabled=false",
		"spring.cloud.discovery.enabled=false",
		"spring.cloud.config.enabled=false",
		"spring.rabbitmq.listener.simple.auto-startup=false",
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
class EmailServiceApplicationTests {

	@Test
	void contextLoads() {
	}

}
