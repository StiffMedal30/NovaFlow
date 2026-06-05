package za.co.idea.service.records;

import java.util.List;

public record IdeaResponse(String ideaId, String message, String refinement, List<IdeaStepResponse> steps) {
}
