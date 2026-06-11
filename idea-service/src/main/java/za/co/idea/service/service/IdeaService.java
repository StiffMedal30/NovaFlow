package za.co.idea.service.service;

import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.records.IdeaStepResponse;
import za.co.idea.service.records.IdeaStepUpdateRequest;
import za.co.idea.service.records.IdeaSummaryResponse;
import za.co.idea.service.records.FeasibilityResponse;

import java.util.List;

public interface IdeaService {
    IdeaResponse addIdea(IdeaRecord idea);
    List<IdeaSummaryResponse> getIdeas();
    IdeaSummaryResponse getIdea(Long ideaId);
    IdeaResponse updateIdea(Long ideaId, IdeaRecord idea);
    IdeaStepResponse updateStep(Long ideaId, Long stepId, IdeaStepUpdateRequest request);
    FeasibilityResponse generateFeasibilityStudy(Long ideaId, String country);
    void deleteIdea(Long ideaId);
    String process(IdeaRecord record);
}
