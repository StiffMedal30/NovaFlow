package za.co.idea.service.service;

import za.co.idea.service.records.IdeaRecord;

public interface IdeaService {
    void addIdea(IdeaRecord idea);
    String process(IdeaRecord record);
}
