package za.co.idea.service.service;

import za.co.idea.service.records.IdeaRecord;

public interface IdeaService {
    String addIdea(IdeaRecord idea);
    String process(IdeaRecord record);
}
