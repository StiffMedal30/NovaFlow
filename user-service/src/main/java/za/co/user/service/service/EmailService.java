package za.co.user.service.service;

public interface EmailService {

    void sendAccountActivationEmail(String to, String token);

    void sendPasswordResetEmail(String to, String token);

    void sendInvitationEmail(String to, String token);
}
