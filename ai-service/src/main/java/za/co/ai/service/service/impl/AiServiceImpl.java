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
import za.co.ai.service.record.FeasibilityRequest;
import za.co.ai.service.record.IdeaRecord;
import za.co.ai.service.record.IdeaRefinementRequest;
import za.co.ai.service.service.AiService;

import java.io.IOException;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

@Service
@AllArgsConstructor
public class AiServiceImpl implements AiService {
    private static final String IDEA_PLANNING_PROMPT = "idea-planning";
    private static final String IDEA_REFINEMENT_PROMPT = "idea-refinement";
    private static final String FEASIBILITY_STUDY_PROMPT = "feasibility-study";

    private final RestClient openAiRestClient;
    private final OpenAiProperties openAiProperties;
    private final AiPromptProperties aiPromptProperties;

    @Override
    public String refineIdea(IdeaRecord idea) {
        AiPromptProperties.PromptDefinition prompt = aiPromptProperties.require(IDEA_PLANNING_PROMPT);

        return generateResponse(
                prompt,
                promptValues(idea.title(), idea.description(), idea.problem(), idea.goal(), idea.targetUsers(),
                        idea.mustHaveFeatures(), idea.constraints(), idea.techPreferences(), idea.unknowns())
        );
    }

    @Override
    public String refineIdeaSection(IdeaRefinementRequest request) {
        AiPromptProperties.PromptDefinition prompt = aiPromptProperties.require(IDEA_REFINEMENT_PROMPT);
        Map<String, String> values = promptValues(
                request.title(),
                request.description(),
                request.problem(),
                request.goal(),
                request.targetUsers(),
                request.mustHaveFeatures(),
                request.constraints(),
                request.techPreferences(),
                request.unknowns()
        );
        values.put("existingPlan", valueOrEmpty(request.existingPlan()));
        values.put("action", valueOrEmpty(request.action()));
        values.put("sectionTitle", valueOrEmpty(request.sectionTitle()));
        values.put("sectionContent", valueOrEmpty(request.sectionContent()));
        values.put("instruction", valueOrEmpty(request.instruction()));

        return generateResponse(prompt, values);
    }

    @Override
    public String generateFeasibilityStudy(FeasibilityRequest request) {
        AiPromptProperties.PromptDefinition prompt = aiPromptProperties.require(FEASIBILITY_STUDY_PROMPT);

        return generateResponse(
                prompt,
                Map.of(
                        "title", request.title(),
                        "description", request.description(),
                        "plan", request.plan(),
                        "country", request.country()
                )
        );
    }

    private Map<String, String> promptValues(
            String title,
            String description,
            String problem,
            String goal,
            String targetUsers,
            String mustHaveFeatures,
            String constraints,
            String techPreferences,
            String unknowns
    ) {
        Map<String, String> values = new LinkedHashMap<>();
        values.put("title", valueOrEmpty(title));
        values.put("description", valueOrEmpty(description));
        values.put("problem", valueOrEmpty(problem));
        values.put("goal", valueOrEmpty(goal));
        values.put("targetUsers", valueOrEmpty(targetUsers));
        values.put("mustHaveFeatures", valueOrEmpty(mustHaveFeatures));
        values.put("constraints", valueOrEmpty(constraints));
        values.put("techPreferences", valueOrEmpty(techPreferences));
        values.put("unknowns", valueOrEmpty(unknowns));
        return values;
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private String generateResponse(AiPromptProperties.PromptDefinition prompt, Map<String, String> values) {
        requireApiKey();

        OpenAiResponsesRequest request = new OpenAiResponsesRequest(
                openAiProperties.refinementModel(),
                prompt.instructions(),
                renderTemplate(prompt.inputTemplate(), values),
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
