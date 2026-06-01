package za.co.api.gateway.controller;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import za.co.api.gateway.records.TranscriptionResponse;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController extends BaseController {

    @PostMapping(value = "/transcribe", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> transcribe(@RequestPart("file") MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new NamedByteArrayResource(file.getBytes(), file.getOriginalFilename()));

            return restTemplate.exchange(
                    AI_SERVICE + "/transcribe",
                    HttpMethod.POST,
                    new HttpEntity<>(body, headers),
                    TranscriptionResponse.class
            );
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not read audio file"));
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Transcription failed: " + e.getMessage()));
        }
    }

    private static class NamedByteArrayResource extends ByteArrayResource {
        private final String filename;

        NamedByteArrayResource(byte[] byteArray, String filename) {
            super(byteArray);
            this.filename = filename == null || filename.isBlank() ? "voice-note.webm" : filename;
        }

        @Override
        public String getFilename() {
            return filename;
        }
    }
}
