package za.co.ai.service.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.Map;

@ConfigurationProperties(prefix = "novaflow.ai")
public record AiPromptProperties(Map<String, PromptDefinition> prompts) {

    public PromptDefinition require(String key) {
        if (prompts == null || !prompts.containsKey(key)) {
            throw new IllegalStateException("AI prompt configuration is missing for key: " + key);
        }

        PromptDefinition prompt = prompts.get(key);
        if (isBlank(prompt.instructions())) {
            throw new IllegalStateException("AI prompt instructions are missing for key: " + key);
        }
        if (isBlank(prompt.inputTemplate())) {
            throw new IllegalStateException("AI prompt input template is missing for key: " + key);
        }
        if (prompt.maxOutputTokens() == null || prompt.maxOutputTokens() <= 0) {
            throw new IllegalStateException("AI prompt max output tokens must be positive for key: " + key);
        }

        return prompt;
    }

    public record PromptDefinition(
            String instructions,
            String inputTemplate,
            Integer maxOutputTokens
    ) {
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
