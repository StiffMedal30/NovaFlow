package za.co.api.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.api.gateway.records.IdeaRequest;
import za.co.api.gateway.records.FeasibilityRequest;
import za.co.api.gateway.records.IdeaStepUpdateRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/idea")
public class IdeaController extends BaseController {

    @GetMapping
    public ResponseEntity<?> getIdeas() {
        try {
            return forwardGetRequest(ideaService);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load ideas: " + e.getMessage()));
        }
    }

    @GetMapping("/{ideaId}")
    public ResponseEntity<?> getIdea(@PathVariable String ideaId) {
        try {
            return forwardGetRequest(ideaService + "/" + ideaId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load idea: " + e.getMessage()));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addNewIdea(@RequestBody IdeaRequest idea) {
        try {
            return forwardPostRequest(ideaService + "/add", idea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not add idea: " + e.getMessage()));
        }
    }

    @PutMapping("/{ideaId}")
    public ResponseEntity<?> updateIdea(@PathVariable String ideaId, @RequestBody IdeaRequest idea) {
        try {
            return forwardPutRequest(ideaService + "/" + ideaId, idea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not update idea: " + e.getMessage()));
        }
    }

    @PostMapping("/{ideaId}/feasibility")
    public ResponseEntity<?> generateFeasibilityStudy(
            @PathVariable String ideaId,
            @RequestBody FeasibilityRequest request
    ) {
        try {
            return forwardPostRequest(ideaService + "/" + ideaId + "/feasibility", request);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not generate feasibility study: " + e.getMessage()));
        }
    }

    @PutMapping("/{ideaId}/steps/{stepId}")
    public ResponseEntity<?> updateStep(
            @PathVariable String ideaId,
            @PathVariable String stepId,
            @RequestBody IdeaStepUpdateRequest request
    ) {
        try {
            return forwardPutRequest(ideaService + "/" + ideaId + "/steps/" + stepId, request);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not update idea step: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{ideaId}")
    public ResponseEntity<?> deleteIdea(@PathVariable String ideaId) {
        try {
            return forwardDeleteRequest(ideaService + "/" + ideaId);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not delete idea: " + e.getMessage()));
        }
    }
}
