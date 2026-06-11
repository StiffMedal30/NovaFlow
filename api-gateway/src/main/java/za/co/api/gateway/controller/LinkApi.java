package za.co.api.gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;
import za.co.api.gateway.service.LinkDecoderService;

import java.net.URI;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LinkApi {

    private final RestTemplate restTemplate;
    private final LinkDecoderService linkDecoderService;

    @Value("${novaflow.services.user-base:http://localhost:8082}")
    private String userServiceBaseUrl;

    public LinkApi(LinkDecoderService linkDecoderService, RestTemplate restTemplate) {
        this.linkDecoderService = linkDecoderService;
        this.restTemplate = restTemplate;
    }

    @GetMapping("/link")
    public ResponseEntity<?> redirect(@RequestParam("t") String encodedToken) {
        try {
            String targetUrl = linkDecoderService.decode(encodedToken);
            URI uri = URI.create(targetUrl);

            String decodedToken = UriComponentsBuilder.fromUri(uri)
                    .build()
                    .getQueryParams()
                    .getFirst("token");

            if (decodedToken == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Invalid token."));
            }

            String path = uri.getPath();
            String url = path.contains("/activate")
                    ? userServiceBaseUrl + "/api/link/redirect/activate?t=" + decodedToken
                    : userServiceBaseUrl + "/api/link/redirect/reset/password?t=" + decodedToken;

            restTemplate.getForEntity(url, Void.class);

            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create("http://frontend-domain/back/to/login/"))
                    .build();


        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Activation failed: " + e.getMessage()));
        }
    }
}
