package za.co.ai.service.service.impl;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import za.co.ai.service.config.AiPromptProperties;
import za.co.ai.service.config.OpenAiProperties;
import za.co.ai.service.record.IdeaRecord;
import za.co.ai.service.service.AiService;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@AllArgsConstructor
public class AiServiceImpl implements AiService {
    private static final String IDEA_PLANNING_PROMPT = "idea-planning";

    private final RestClient openAiRestClient;
    private final OpenAiProperties openAiProperties;
    private final AiPromptProperties aiPromptProperties;

    @Override
    public String refineIdea(IdeaRecord idea) {
        requireApiKey();
        AiPromptProperties.PromptDefinition prompt = aiPromptProperties.require(IDEA_PLANNING_PROMPT);

        OpenAiResponsesRequest request = new OpenAiResponsesRequest(
                openAiProperties.refinementModel(),
                prompt.instructions(),
                renderTemplate(prompt.inputTemplate(), Map.of(
                        "title", idea.title(),
                        "description", idea.description()
                )),
                prompt.maxOutputTokens()
        );

        OpenAiResponsesResponse response = openAiRestClient.post()
                .uri("/responses")
                .headers(headers -> headers.setBearerAuth(openAiProperties.apiKey()))
                .body(request)
                .retrieve()
                .body(OpenAiResponsesResponse.class);

        return extractText(response);
    }

    @Override
    public String transcribe(MultipartFile audioFile) {
        requireApiKey();

        try {
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("model", openAiProperties.transcriptionModel());
            body.add("file", new NamedByteArrayResource(audioFile.getBytes(), audioFile.getOriginalFilename()));

            OpenAiTranscriptionResponse response = openAiRestClient.post()
                    .uri("/audio/transcriptions")
                    .headers(headers -> headers.setBearerAuth(openAiProperties.apiKey()))
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(OpenAiTranscriptionResponse.class);

            return response == null ? "" : response.text();
        } catch (IOException e) {
            throw new IllegalArgumentException("Could not read audio file", e);
        }
    }

    private void requireApiKey() {
        if (!openAiProperties.hasApiKey()) {
            throw new IllegalStateException("OPENAI_API_KEY is not configured");
        }
    }

    private String renderTemplate(String template, Map<String, String> values) {
        String rendered = template;
        for (Map.Entry<String, String> entry : values.entrySet()) {
            rendered = rendered.replace("{{" + entry.getKey() + "}}", entry.getValue() == null ? "" : entry.getValue());
        }
        return rendered;
    }

    private String extractText(OpenAiResponsesResponse response) {
        if (response == null) {
            return "";
        }
        if (response.outputText() != null && !response.outputText().isBlank()) {
            return response.outputText();
        }

        return response.output() == null ? "" : response.output().stream()
                .filter(Objects::nonNull)
                .flatMap(output -> output.content() == null ? List.<OpenAiContent>of().stream() : output.content().stream())
                .map(OpenAiContent::text)
                .filter(text -> text != null && !text.isBlank())
                .reduce((left, right) -> left + System.lineSeparator() + right)
                .orElse("");
    }

    private record OpenAiResponsesRequest(
            String model,
            String instructions,
            String input,
            @JsonProperty("max_output_tokens") int maxOutputTokens
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenAiResponsesResponse(
            @JsonProperty("output_text") String outputText,
            List<OpenAiOutput> output
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenAiOutput(List<OpenAiContent> content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenAiContent(String text) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record OpenAiTranscriptionResponse(String text) {
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
