package za.co.idea.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.records.IdeaStepResponse;
import za.co.idea.service.records.IdeaStepUpdateRequest;
import za.co.idea.service.records.IdeaSummaryResponse;
import za.co.idea.service.records.FeasibilityRequest;
import za.co.idea.service.records.FeasibilityResponse;
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

    @GetMapping("/{ideaId}")
    public ResponseEntity<IdeaSummaryResponse> getIdea(@PathVariable Long ideaId) {
        try {
            return ResponseEntity.ok(ideaService.getIdea(ideaId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/add")
    public ResponseEntity<IdeaResponse> addIdea(@RequestBody IdeaRecord idea) {
        try {
            return ResponseEntity.ok(ideaService.addIdea(idea));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new IdeaResponse(null, e.getMessage(), null, List.of()));
        }
    }

    @PutMapping("/{ideaId}")
    public ResponseEntity<IdeaResponse> updateIdea(@PathVariable Long ideaId, @RequestBody IdeaRecord idea) {
        try {
            return ResponseEntity.ok(ideaService.updateIdea(ideaId, idea));
        } catch (IllegalArgumentException e) {
            if ("Idea not found.".equals(e.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(new IdeaResponse(String.valueOf(ideaId), e.getMessage(), null, List.of()));
        }
    }

    @PutMapping("/{ideaId}/steps/{stepId}")
    public ResponseEntity<IdeaStepResponse> updateStep(
            @PathVariable Long ideaId,
            @PathVariable Long stepId,
            @RequestBody IdeaStepUpdateRequest request
    ) {
        try {
            return ResponseEntity.ok(ideaService.updateStep(ideaId, stepId, request));
        } catch (IllegalArgumentException e) {
            if ("Idea not found.".equals(e.getMessage()) || "Step not found.".equals(e.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{ideaId}/feasibility")
    public ResponseEntity<FeasibilityResponse> generateFeasibilityStudy(
            @PathVariable Long ideaId,
            @RequestBody FeasibilityRequest request
    ) {
        try {
            return ResponseEntity.ok(ideaService.generateFeasibilityStudy(ideaId, request.country()));
        } catch (IllegalArgumentException e) {
            if ("Idea not found.".equals(e.getMessage())) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{ideaId}")
    public ResponseEntity<Void> deleteIdea(@PathVariable Long ideaId) {
        try {
            ideaService.deleteIdea(ideaId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
