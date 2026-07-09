package za.co.idea.service.records;

import java.util.List;

public record IdeaRefinementResponse(
        String ideaId,
        String message,
        String refinement,
        String assistantOutput,
        boolean planUpdated,
        List<IdeaStepResponse> steps
) {
}
