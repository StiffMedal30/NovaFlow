package za.co.idea.service.records;

import java.time.LocalDate;

public record IdeaStepResponse(
        String id,
        int position,
        String title,
        String details,
        String priority,
        String owner,
        LocalDate dueDate,
        boolean completed
) {
}
