package za.co.idea.service.controller;

import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.service.IdeaService;

import java.util.Map;

@RestController
@RequestMapping("/api/idea")
@AllArgsConstructor
public class IdeaController {

    private final IdeaService ideaService;

    @PostMapping("/add")
    public ResponseEntity<Map<String, String>> addIdea(@RequestBody IdeaRecord idea) {
        try {
            ideaService.addIdea(idea);
            return ResponseEntity.ok(Map.of("message", idea.title() + " has been added."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
