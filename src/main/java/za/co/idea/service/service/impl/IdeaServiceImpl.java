package za.co.idea.service.service.impl;

import org.springframework.stereotype.Service;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.service.IdeaService;

@Service
public class IdeaServiceImpl implements IdeaService {

    @Override
    public void addIdea(IdeaRecord idea) {
        System.out.println("pretend add idea " + idea.title());
    }
}
