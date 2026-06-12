package za.co.api.gateway.records;

public record GoogleOAuthRequest(
        String providerSubject,
        String email,
        String name,
        boolean emailVerified
) {
}
