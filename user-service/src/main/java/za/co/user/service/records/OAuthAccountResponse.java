package za.co.user.service.records;

public record OAuthAccountResponse(
        String status,
        String username,
        String token,
        String message
) {
    public static OAuthAccountResponse pending(String username) {
        return new OAuthAccountResponse(
                "PENDING_ACTIVATION",
                username,
                null,
                "Check your email to activate your NovaFlow account."
        );
    }

    public static OAuthAccountResponse active(String username, String token) {
        return new OAuthAccountResponse("ACTIVE", username, token, "Login successful.");
    }
}
