package za.co.ai.service.service.impl;

import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import za.co.ai.service.record.IdeaRecord;
import za.co.ai.service.service.AiService;

@Service
@AllArgsConstructor
public class AiServiceImpl implements AiService {
    @Override
    public String refineIdea(IdeaRecord idea) {
        return "";
    }
}
