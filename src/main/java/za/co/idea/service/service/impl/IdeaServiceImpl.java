package za.co.idea.service.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import za.co.idea.service.client.AiServiceClient;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.service.IdeaService;

@Service
@AllArgsConstructor
public class IdeaServiceImpl implements IdeaService {

    private final AiServiceClient aiClient;

    @Override
    public void addIdea(IdeaRecord idea) {
        System.out.println("pretend add idea " + idea.title());
        process(idea);
    }

    @Override
    public String process(IdeaRecord record) {
        return aiClient.processIdea(record).output();
    }
}
