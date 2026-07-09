package za.co.api.gateway.records;

public record IdeaRefinementRequest(
        String action,
        String sectionTitle,
        String sectionContent,
        String instruction
) {
}
