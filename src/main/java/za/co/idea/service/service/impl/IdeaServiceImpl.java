package za.co.idea.service.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import za.co.idea.service.client.AiServiceClient;
import za.co.idea.service.entity.IdeaEntity;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.records.IdeaSummaryResponse;
import za.co.idea.service.repository.IdeaRepository;
import za.co.idea.service.service.IdeaService;

import java.time.LocalDateTime;
import java.util.List;

@Service
@AllArgsConstructor
@Slf4j
public class IdeaServiceImpl implements IdeaService {

    private final AiServiceClient aiClient;
    private final IdeaRepository ideaRepository;

    @Override
    public IdeaResponse addIdea(IdeaRecord idea) {
        validate(idea);

        IdeaRecord normalizedIdea = new IdeaRecord(idea.title().trim(), idea.description().trim());

        IdeaEntity entity = new IdeaEntity();
        entity.setTitle(normalizedIdea.title());
        entity.setDescription(normalizedIdea.description());
        entity.setCreatedBy("local");
        entity.setStatus("ACTIVE");
        entity.setAiProcessed(false);
        entity = ideaRepository.save(entity);

        try {
            String plan = process(normalizedIdea);
            entity.setAiResponse(plan);
            entity.setAiProcessed(true);
            entity.setModifiedBy("ai-service");
            ideaRepository.save(entity);
            return new IdeaResponse(entity.getTitle() + " has been added.", plan);
        } catch (RuntimeException e) {
            log.warn("Idea {} was saved, but AI planning failed", entity.getId(), e);
            return new IdeaResponse(entity.getTitle() + " has been saved. AI planning is unavailable right now.", null);
        }
    }

    @Override
    public List<IdeaSummaryResponse> getIdeas() {
        return ideaRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public String process(IdeaRecord record) {
        return aiClient.processIdea(record).output();
    }

    private void validate(IdeaRecord idea) {
        if (idea == null || idea.title() == null || idea.title().isBlank()) {
            throw new IllegalArgumentException("Idea title is required.");
        }
        if (idea.description() == null || idea.description().isBlank()) {
            throw new IllegalArgumentException("Idea description is required.");
        }
    }

    private IdeaSummaryResponse toResponse(IdeaEntity idea) {
        return new IdeaSummaryResponse(
                String.valueOf(idea.getId()),
                idea.getTitle(),
                idea.getDescription(),
                valueOrEmpty(idea.getCreatedBy()),
                format(idea.getCreatedAt()),
                format(idea.getModifiedAt()),
                valueOrDefault(idea.getStatus(), "ACTIVE"),
                idea.isAiProcessed(),
                valueOrEmpty(idea.getAiResponse())
        );
    }

    private String format(LocalDateTime value) {
        return value == null ? "" : value.toString();
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private String valueOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}
