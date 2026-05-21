package za.co.ai.service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "openai")
public record OpenAiProperties(
        String apiKey,
        String baseUrl,
        String refinementModel,
        String transcriptionModel
) {
    public OpenAiProperties {
        baseUrl = isBlank(baseUrl) ? "https://api.openai.com/v1" : baseUrl;
        refinementModel = isBlank(refinementModel) ? "gpt-5.2" : refinementModel;
        transcriptionModel = isBlank(transcriptionModel) ? "gpt-4o-mini-transcribe" : transcriptionModel;
    }

    public boolean hasApiKey() {
        return !isBlank(apiKey);
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
