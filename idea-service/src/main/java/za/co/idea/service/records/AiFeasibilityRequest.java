package za.co.idea.service.records;

public record AiFeasibilityRequest(
        String title,
        String description,
        String plan,
        String country
) {
}
