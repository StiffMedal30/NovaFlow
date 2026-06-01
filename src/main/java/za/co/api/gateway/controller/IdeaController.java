package za.co.api.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import za.co.api.gateway.records.IdeaRequest;

import java.util.Map;

@RestController
@RequestMapping("/api/idea")
public class IdeaController extends BaseController {

    @GetMapping
    public ResponseEntity<?> getIdeas() {
        try {
            return forwardGetRequest(IDEA_SERVICE);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not load ideas: " + e.getMessage()));
        }
    }

    @PostMapping("/add")
    public ResponseEntity<?> addNewIdea(@RequestBody IdeaRequest idea) {
        try {
            return forwardPostRequest(IDEA_SERVICE + "/add", idea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not add idea: " + e.getMessage()));
        }
    }
}
