package za.co.idea.service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import za.co.idea.service.records.AiServiceResponse;
import za.co.idea.service.records.AiFeasibilityRequest;
import za.co.idea.service.records.IdeaRecord;

@FeignClient(name = "ai-service")
public interface AiServiceClient {

    @PostMapping("/api/ai/process")
    AiServiceResponse processIdea(@RequestBody IdeaRecord idea);

    @PostMapping("/api/ai/feasibility")
    AiServiceResponse generateFeasibilityStudy(@RequestBody AiFeasibilityRequest request);

}

