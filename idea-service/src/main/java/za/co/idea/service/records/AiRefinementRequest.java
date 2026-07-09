package za.co.idea.service.records;

public record AiRefinementRequest(
        String title,
        String description,
        String problem,
        String goal,
        String targetUsers,
        String mustHaveFeatures,
        String constraints,
        String techPreferences,
        String unknowns,
        String existingPlan,
        String action,
        String sectionTitle,
        String sectionContent,
        String instruction
) {
}
