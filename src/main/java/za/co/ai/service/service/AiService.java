package za.co.ai.service.service;

import za.co.ai.service.record.IdeaRecord;
import za.co.ai.service.record.FeasibilityRequest;

import org.springframework.web.multipart.MultipartFile;

public interface AiService {
    String refineIdea(IdeaRecord idea);

    String generateFeasibilityStudy(FeasibilityRequest request);

    String transcribe(MultipartFile audioFile);
}
