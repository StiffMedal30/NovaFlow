package za.co.ai.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.ai.service.record.AiResponse;
import za.co.ai.service.record.IdeaRecord;
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
}
