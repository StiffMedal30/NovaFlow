package za.co.ai.service.service;

import za.co.ai.service.record.IdeaRecord;

import org.springframework.web.multipart.MultipartFile;

public interface AiService {
    String refineIdea(IdeaRecord idea);

    String transcribe(MultipartFile audioFile);
}
