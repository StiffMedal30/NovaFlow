package za.co.api.gateway.records;

public record IdeaRequest(
        String title,
        String description,
        String problem,
        String goal,
        String targetUsers,
        String mustHaveFeatures,
        String constraints,
        String techPreferences,
        String unknowns
) {
}
