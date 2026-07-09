package za.co.ai.service.service;

import za.co.ai.service.record.IdeaRecord;
import za.co.ai.service.record.FeasibilityRequest;
import za.co.ai.service.record.IdeaRefinementRequest;

import org.springframework.web.multipart.MultipartFile;

public interface AiService {
    String refineIdea(IdeaRecord idea);

    String refineIdeaSection(IdeaRefinementRequest request);

    String generateFeasibilityStudy(FeasibilityRequest request);

    String transcribe(MultipartFile audioFile);
}
