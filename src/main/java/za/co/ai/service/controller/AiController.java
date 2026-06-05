package za.co.ai.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import za.co.ai.service.record.AiResponse;
import za.co.ai.service.record.FeasibilityRequest;
import za.co.ai.service.record.IdeaRecord;
import za.co.ai.service.record.TranscriptionResponse;
import za.co.ai.service.service.AiService;

@RestController
@RequestMapping("/api/ai")
@AllArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/process")
    public AiResponse processIdea(@RequestBody IdeaRecord idea) {
        String result = aiService.refineIdea(idea);
        return new AiResponse(result);
    }

    @PostMapping("/feasibility")
    public AiResponse feasibilityStudy(@RequestBody FeasibilityRequest request) {
        return new AiResponse(aiService.generateFeasibilityStudy(request));
    }

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TranscriptionResponse transcribe(@RequestPart("file") MultipartFile audioFile) {
        return new TranscriptionResponse(aiService.transcribe(audioFile));
    }
}
