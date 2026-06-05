package za.co.ai.service.record;

public record FeasibilityRequest(
        String title,
        String description,
        String plan,
        String country
) {
}
