package za.co.user.service.service;

public interface EmailNotificationPublisher {

    void publishAccountActivation(String recipient, String token);

    void publishPasswordReset(String recipient, String token);

    void publishInvitation(String recipient, String token);
}
