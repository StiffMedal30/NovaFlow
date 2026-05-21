package za.co.idea.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.service.IdeaService;

@RestController
@RequestMapping("/api/idea")
@AllArgsConstructor
public class IdeaController {

    private final IdeaService ideaService;

    @PostMapping("/add")
    public ResponseEntity<IdeaResponse> addIdea(@RequestBody IdeaRecord idea) {
        try {
            String refinement = ideaService.addIdea(idea);
            return ResponseEntity.ok(new IdeaResponse(idea.title() + " has been added.", refinement));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new IdeaResponse(e.getMessage(), null));
        }
    }
}
