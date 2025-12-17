package za.co.api.gateway.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/idea")
public class IdeaController extends BaseController {

    @PostMapping("/add")
    public ResponseEntity<?> addNewIdea(@RequestBody Map<String, Object> idea) {
        try {
            return forwardPostRequest(IDEA_SERVICE + "/add", idea);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Could not add idea: " + e.getMessage()));
        }
    }
}
