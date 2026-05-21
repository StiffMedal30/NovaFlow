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
    public String addIdea(IdeaRecord idea) {
        return process(idea);
    }

    @Override
    public String process(IdeaRecord record) {
        return aiClient.processIdea(record).output();
    }
}
