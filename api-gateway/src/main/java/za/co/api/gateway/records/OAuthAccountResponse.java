package za.co.api.gateway.records;

public record OAuthAccountResponse(
        String status,
        String username,
        String token,
        String message
) {
}
