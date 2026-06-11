package za.co.idea.service.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.idea.service.client.AiServiceClient;
import za.co.idea.service.entity.IdeaEntity;
import za.co.idea.service.entity.IdeaStepEntity;
import za.co.idea.service.records.AiFeasibilityRequest;
import za.co.idea.service.records.FeasibilityResponse;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaResponse;
import za.co.idea.service.records.IdeaStepResponse;
import za.co.idea.service.records.IdeaStepUpdateRequest;
import za.co.idea.service.records.IdeaSummaryResponse;
import za.co.idea.service.repository.IdeaRepository;
import za.co.idea.service.repository.IdeaStepRepository;
import za.co.idea.service.service.IdeaService;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@AllArgsConstructor
@Slf4j
@Transactional
public class IdeaServiceImpl implements IdeaService {

    private static final Pattern STEP_HEADING = Pattern.compile("(?m)^\\s*(\\d+)\\.\\s+(.+?)\\s*$");
    private static final Pattern PRIORITY_LINE = Pattern.compile("(?im)^\\s*-\\s*Priority:\\s*(P[012])\\s*$");

    private final AiServiceClient aiClient;
    private final IdeaRepository ideaRepository;
    private final IdeaStepRepository ideaStepRepository;

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
            List<IdeaStepResponse> steps = replaceSteps(entity.getId(), plan);
            return new IdeaResponse(String.valueOf(entity.getId()), entity.getTitle() + " has been added.", plan, steps);
        } catch (RuntimeException e) {
            log.warn("Idea {} was saved, but AI planning failed", entity.getId(), e);
            return new IdeaResponse(
                    String.valueOf(entity.getId()),
                    entity.getTitle() + " has been saved. AI planning is unavailable right now.",
                    null,
                    List.of()
            );
        }
    }

    @Override
    public List<IdeaSummaryResponse> getIdeas() {
        return ideaRepository.findAllByStatusNotOrderByCreatedAtDesc("DELETED")
                .stream()
                .map(idea -> toResponse(idea, false))
                .toList();
    }

    @Override
    public IdeaSummaryResponse getIdea(Long ideaId) {
        return toResponse(findIdea(ideaId), true);
    }

    @Override
    public IdeaResponse updateIdea(Long ideaId, IdeaRecord idea) {
        validate(idea);

        IdeaEntity entity = findIdea(ideaId);
        IdeaRecord normalizedIdea = new IdeaRecord(idea.title().trim(), idea.description().trim());
        entity.setTitle(normalizedIdea.title());
        entity.setDescription(normalizedIdea.description());
        entity.setFeasibilityCountry(null);
        entity.setFeasibilityResponse(null);
        entity.setModifiedBy("local");
        ideaRepository.save(entity);

        try {
            String plan = process(normalizedIdea);
            entity.setAiResponse(plan);
            entity.setAiProcessed(true);
            entity.setModifiedBy("ai-service");
            ideaRepository.save(entity);
            List<IdeaStepResponse> steps = replaceSteps(entity.getId(), plan);
            return new IdeaResponse(String.valueOf(entity.getId()), entity.getTitle() + " has been updated.", plan, steps);
        } catch (RuntimeException e) {
            entity.setAiProcessed(false);
            ideaRepository.save(entity);
            log.warn("Idea {} was updated, but AI planning failed", entity.getId(), e);
            return new IdeaResponse(
                    String.valueOf(entity.getId()),
                    entity.getTitle() + " has been updated. AI planning is unavailable right now.",
                    entity.getAiResponse(),
                    getSteps(entity.getId())
            );
        }
    }

    @Override
    public IdeaStepResponse updateStep(Long ideaId, Long stepId, IdeaStepUpdateRequest request) {
        findIdea(ideaId);
        if (request == null) {
            throw new IllegalArgumentException("Step update is required.");
        }

        IdeaStepEntity step = ideaStepRepository.findByIdAndIdeaId(stepId, ideaId)
                .orElseThrow(() -> new IllegalArgumentException("Step not found."));

        if (request.priority() != null) {
            step.setPriority(normalizePriority(request.priority()));
        }
        if (request.owner() != null) {
            String owner = request.owner().trim();
            if (owner.length() > 255) {
                throw new IllegalArgumentException("Owner must be 255 characters or fewer.");
            }
            step.setOwner(owner.isBlank() ? null : owner);
        }
        if (request.dueDate() != null || step.getDueDate() != null) {
            step.setDueDate(request.dueDate());
        }
        if (request.completed() != null) {
            step.setCompleted(request.completed());
        }

        return toStepResponse(ideaStepRepository.save(step));
    }

    @Override
    public FeasibilityResponse generateFeasibilityStudy(Long ideaId, String country) {
        if (country == null || country.isBlank()) {
            throw new IllegalArgumentException("Country is required.");
        }

        IdeaEntity entity = findIdea(ideaId);
        String normalizedCountry = country.trim();
        String study = aiClient.generateFeasibilityStudy(new AiFeasibilityRequest(
                entity.getTitle(),
                entity.getDescription(),
                valueOrEmpty(entity.getAiResponse()),
                normalizedCountry
        )).output();

        entity.setFeasibilityCountry(normalizedCountry);
        entity.setFeasibilityResponse(study);
        entity.setModifiedBy("ai-service");
        ideaRepository.save(entity);
        return new FeasibilityResponse(normalizedCountry, study);
    }

    @Override
    public void deleteIdea(Long ideaId) {
        IdeaEntity entity = findIdea(ideaId);
        entity.setStatus("DELETED");
        entity.setModifiedBy("local");
        ideaRepository.save(entity);
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

    private IdeaEntity findIdea(Long ideaId) {
        return ideaRepository.findById(ideaId)
                .filter(idea -> !"DELETED".equalsIgnoreCase(idea.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Idea not found."));
    }

    private IdeaSummaryResponse toResponse(IdeaEntity idea, boolean initializeSteps) {
        List<IdeaStepResponse> steps = List.of();
        if (initializeSteps) {
            steps = getSteps(idea.getId());
            if (steps.isEmpty() && idea.getAiResponse() != null && !idea.getAiResponse().isBlank()) {
                steps = replaceSteps(idea.getId(), idea.getAiResponse());
            }
        }

        return new IdeaSummaryResponse(
                String.valueOf(idea.getId()),
                idea.getTitle(),
                idea.getDescription(),
                valueOrEmpty(idea.getCreatedBy()),
                format(idea.getCreatedAt()),
                format(idea.getModifiedAt()),
                valueOrDefault(idea.getStatus(), "ACTIVE"),
                idea.isAiProcessed(),
                valueOrEmpty(idea.getAiResponse()),
                valueOrEmpty(idea.getFeasibilityCountry()),
                valueOrEmpty(idea.getFeasibilityResponse()),
                steps
        );
    }

    private List<IdeaStepResponse> replaceSteps(Long ideaId, String plan) {
        ideaStepRepository.deleteAllByIdeaId(ideaId);
        List<StepDraft> drafts = parseSteps(plan);
        if (drafts.isEmpty()) {
            return List.of();
        }

        List<IdeaStepEntity> entities = new ArrayList<>();
        for (int index = 0; index < drafts.size(); index += 1) {
            StepDraft draft = drafts.get(index);
            IdeaStepEntity step = new IdeaStepEntity();
            step.setIdeaId(ideaId);
            step.setPosition(index + 1);
            step.setTitle(draft.title());
            step.setDetails(draft.details());
            step.setPriority(draft.priority());
            entities.add(step);
        }
        return ideaStepRepository.saveAll(entities).stream()
                .map(this::toStepResponse)
                .toList();
    }

    private List<StepDraft> parseSteps(String plan) {
        if (plan == null || plan.isBlank()) {
            return List.of();
        }

        String lowerPlan = plan.toLowerCase(Locale.ROOT);
        int sectionStart = lowerPlan.indexOf("## prioritized steps");
        if (sectionStart < 0) {
            return List.of();
        }
        int sectionEnd = lowerPlan.indexOf("\n## ", sectionStart + 3);
        String section = plan.substring(sectionStart, sectionEnd < 0 ? plan.length() : sectionEnd);

        Matcher matcher = STEP_HEADING.matcher(section);
        List<Integer> starts = new ArrayList<>();
        List<Integer> ends = new ArrayList<>();
        List<String> titles = new ArrayList<>();
        while (matcher.find()) {
            starts.add(matcher.start());
            ends.add(matcher.end());
            titles.add(cleanTitle(matcher.group(2)));
        }

        List<StepDraft> steps = new ArrayList<>();
        for (int index = 0; index < titles.size(); index += 1) {
            int bodyEnd = index + 1 < starts.size() ? starts.get(index + 1) : section.length();
            String body = section.substring(ends.get(index), bodyEnd).trim();
            Matcher priorityMatcher = PRIORITY_LINE.matcher(body);
            String priority = priorityMatcher.find() ? priorityMatcher.group(1).toUpperCase(Locale.ROOT) : "P1";
            String details = PRIORITY_LINE.matcher(body).replaceAll("").trim();
            steps.add(new StepDraft(titles.get(index), details, priority));
        }
        return steps;
    }

    private String cleanTitle(String title) {
        return title.replace("**", "").replaceAll("\\s+-\\s*$", "").trim();
    }

    private String normalizePriority(String priority) {
        String normalized = priority.trim().toUpperCase(Locale.ROOT);
        if (!List.of("P0", "P1", "P2").contains(normalized)) {
            throw new IllegalArgumentException("Priority must be P0, P1, or P2.");
        }
        return normalized;
    }

    private List<IdeaStepResponse> getSteps(Long ideaId) {
        return ideaStepRepository.findAllByIdeaIdOrderByPosition(ideaId).stream()
                .map(this::toStepResponse)
                .toList();
    }

    private IdeaStepResponse toStepResponse(IdeaStepEntity step) {
        return new IdeaStepResponse(
                String.valueOf(step.getId()),
                step.getPosition(),
                step.getTitle(),
                valueOrEmpty(step.getDetails()),
                valueOrDefault(step.getPriority(), "P1"),
                valueOrEmpty(step.getOwner()),
                step.getDueDate(),
                step.isCompleted()
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

    private record StepDraft(String title, String details, String priority) {
    }
}
