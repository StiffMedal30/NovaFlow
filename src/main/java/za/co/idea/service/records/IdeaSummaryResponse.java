package za.co.idea.service.records;

public record IdeaSummaryResponse(
        String id,
        String title,
        String description,
        String createdBy,
        String createdDate,
        String updatedDate,
        String status,
        boolean aiProcessed,
        String aiResponse
) {
}
