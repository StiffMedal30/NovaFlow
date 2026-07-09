package za.co.idea.service.records;

import java.util.List;

public record IdeaSummaryResponse(
        String id,
        String title,
        String description,
        String problem,
        String goal,
        String targetUsers,
        String mustHaveFeatures,
        String constraints,
        String techPreferences,
        String unknowns,
        String createdBy,
        String createdDate,
        String updatedDate,
        String status,
        boolean aiProcessed,
        String aiResponse,
        String feasibilityCountry,
        String feasibilityResponse,
        List<IdeaStepResponse> steps
) {
}
