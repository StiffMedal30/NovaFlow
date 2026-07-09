package za.co.ai.service.record;

public record IdeaRefinementRequest(
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
