package za.co.chat.service.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class TestController {

    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        try {
            return ResponseEntity.ok(Map.of("message",
                    "Test API call successful."));
        } catch (RuntimeException e) {
            return ResponseEntity.ok().body(Map.of("message",
                    "Oh Snap! Something went wrong. - " + e.getMessage()));
        }
    }

}

