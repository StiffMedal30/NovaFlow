package za.co.idea.service.records;

public record IdeaRefinementRequest(
        String action,
        String sectionTitle,
        String sectionContent,
        String instruction
) {
}
