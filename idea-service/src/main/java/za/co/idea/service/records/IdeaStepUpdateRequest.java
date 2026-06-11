package za.co.idea.service.records;

import java.time.LocalDate;

public record IdeaStepUpdateRequest(
        String priority,
        String owner,
        LocalDate dueDate,
        Boolean completed
) {
}
