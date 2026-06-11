package za.co.api.gateway.records;

import java.time.LocalDate;

public record IdeaStepUpdateRequest(
        String priority,
        String owner,
        LocalDate dueDate,
        Boolean completed
) {
}
