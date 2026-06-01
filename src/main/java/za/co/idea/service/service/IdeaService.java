package za.co.idea.service.service;

import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.records.IdeaSummaryResponse;

import java.util.List;

public interface IdeaService {
    IdeaResponse addIdea(IdeaRecord idea);
    List<IdeaSummaryResponse> getIdeas();
    String process(IdeaRecord record);
}
