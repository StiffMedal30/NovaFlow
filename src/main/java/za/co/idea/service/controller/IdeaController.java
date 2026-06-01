package za.co.idea.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.records.IdeaSummaryResponse;
import za.co.idea.service.service.IdeaService;

import java.util.List;

@RestController
@RequestMapping("/api/idea")
@AllArgsConstructor
public class IdeaController {

    private final IdeaService ideaService;

    @GetMapping
    public List<IdeaSummaryResponse> getIdeas() {
        return ideaService.getIdeas();
    }

    @PostMapping("/add")
    public ResponseEntity<IdeaResponse> addIdea(@RequestBody IdeaRecord idea) {
        try {
            return ResponseEntity.ok(ideaService.addIdea(idea));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new IdeaResponse(e.getMessage(), null));
        }
    }
}
