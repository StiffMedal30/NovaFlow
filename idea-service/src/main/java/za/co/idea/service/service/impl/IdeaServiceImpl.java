package za.co.idea.service.service.impl;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import za.co.idea.service.client.AiServiceClient;
import za.co.idea.service.entity.IdeaEntity;
import za.co.idea.service.entity.IdeaStepEntity;
import za.co.idea.service.records.AiFeasibilityRequest;
import za.co.idea.service.records.AiRefinementRequest;
import za.co.idea.service.records.FeasibilityResponse;
import za.co.idea.service.records.IdeaRecord;
import za.co.idea.service.records.IdeaRefinementRequest;
import za.co.idea.service.records.IdeaRefinementResponse;
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

    private static final Pattern STEP_HEADING = Pattern.compile("(?m)^\\s*(?:(\\d+)[.)]\\s+|-\\s*(P[012])\\s*[-—:]\\s*)(.+?)\\s*$");
    private static final Pattern HEADING_PRIORITY = Pattern.compile("(?i)^\\s*(?:priority\\s*:\\s*)?(P[012])\\s*(?:[-—:]\\s*)?(.+?)\\s*$");
    private static final Pattern PRIORITY_LINE = Pattern.compile("(?im)^\\s*-\\s*(?:\\*\\*)?Priority\\s*:\\s*(?:\\*\\*)?\\s*(P[012])\\s*$");
    private static final List<String> PLAN_UPDATE_ACTIONS = List.of("EXPAND", "REWRITE", "SIMPLIFY", "ADD_STEPS");
    private static final List<String> ASSISTANT_ONLY_ACTIONS = List.of("EXPLAIN", "CHALLENGE");

    private final AiServiceClient aiClient;
    private final IdeaRepository ideaRepository;
    private final IdeaStepRepository ideaStepRepository;

    @Override
    public IdeaResponse addIdea(IdeaRecord idea) {
        validate(idea);

        IdeaRecord normalizedIdea = normalizeIdea(idea);

        IdeaEntity entity = new IdeaEntity();
        applyIdea(entity, normalizedIdea);
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
        IdeaRecord normalizedIdea = normalizeIdea(idea);
        applyIdea(entity, normalizedIdea);
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
    public IdeaRefinementResponse refineIdea(Long ideaId, IdeaRefinementRequest request) {
        IdeaEntity entity = findIdea(ideaId);
        if (request == null) {
            throw new IllegalArgumentException("Refinement request is required.");
        }

        String action = normalizeAction(request.action());
        String output = aiClient.refineIdea(new AiRefinementRequest(
                entity.getTitle(),
                valueOrEmpty(entity.getDescription()),
                valueOrEmpty(entity.getProblem()),
                valueOrEmpty(entity.getGoal()),
                valueOrEmpty(entity.getTargetUsers()),
                valueOrEmpty(entity.getMustHaveFeatures()),
                valueOrEmpty(entity.getConstraints()),
                valueOrEmpty(entity.getTechPreferences()),
                valueOrEmpty(entity.getUnknowns()),
                valueOrEmpty(entity.getAiResponse()),
                action,
                valueOrDefault(request.sectionTitle(), "Full plan"),
                valueOrEmpty(request.sectionContent()),
                valueOrEmpty(request.instruction())
        )).output();

        if (PLAN_UPDATE_ACTIONS.contains(action)) {
            if (output == null || output.isBlank()) {
                throw new IllegalStateException("AI did not return an updated plan.");
            }

            entity.setAiResponse(output);
            entity.setAiProcessed(true);
            entity.setModifiedBy("ai-service");
            ideaRepository.save(entity);
            List<IdeaStepResponse> steps = replaceSteps(entity.getId(), output);
            return new IdeaRefinementResponse(
                    String.valueOf(entity.getId()),
                    "Plan updated.",
                    output,
                    "",
                    true,
                    steps
            );
        }

        return new IdeaRefinementResponse(
                String.valueOf(entity.getId()),
                "Assistant response ready.",
                valueOrEmpty(entity.getAiResponse()),
                valueOrEmpty(output),
                false,
                getSteps(entity.getId())
        );
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
        if (!hasIdeaContent(idea)) {
            throw new IllegalArgumentException("Add idea notes or fill in at least one brief field.");
        }
    }

    private IdeaRecord normalizeIdea(IdeaRecord idea) {
        return new IdeaRecord(
                idea.title().trim(),
                normalizeText(idea.description()),
                normalizeText(idea.problem()),
                normalizeText(idea.goal()),
                normalizeText(idea.targetUsers()),
                normalizeText(idea.mustHaveFeatures()),
                normalizeText(idea.constraints()),
                normalizeText(idea.techPreferences()),
                normalizeText(idea.unknowns())
        );
    }

    private void applyIdea(IdeaEntity entity, IdeaRecord idea) {
        entity.setTitle(idea.title());
        entity.setDescription(idea.description());
        entity.setProblem(idea.problem());
        entity.setGoal(idea.goal());
        entity.setTargetUsers(idea.targetUsers());
        entity.setMustHaveFeatures(idea.mustHaveFeatures());
        entity.setConstraints(idea.constraints());
        entity.setTechPreferences(idea.techPreferences());
        entity.setUnknowns(idea.unknowns());
    }

    private boolean hasIdeaContent(IdeaRecord idea) {
        return hasText(idea.description())
                || hasText(idea.problem())
                || hasText(idea.goal())
                || hasText(idea.targetUsers())
                || hasText(idea.mustHaveFeatures())
                || hasText(idea.constraints())
                || hasText(idea.techPreferences())
                || hasText(idea.unknowns());
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalizeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String normalizeAction(String action) {
        if (action == null || action.isBlank()) {
            throw new IllegalArgumentException("Refinement action is required.");
        }

        String normalized = action.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        if (!PLAN_UPDATE_ACTIONS.contains(normalized) && !ASSISTANT_ONLY_ACTIONS.contains(normalized)) {
            throw new IllegalArgumentException("Unknown refinement action.");
        }

        return normalized;
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
                valueOrEmpty(idea.getProblem()),
                valueOrEmpty(idea.getGoal()),
                valueOrEmpty(idea.getTargetUsers()),
                valueOrEmpty(idea.getMustHaveFeatures()),
                valueOrEmpty(idea.getConstraints()),
                valueOrEmpty(idea.getTechPreferences()),
                valueOrEmpty(idea.getUnknowns()),
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
        List<String> headingPriorities = new ArrayList<>();
        while (matcher.find()) {
            starts.add(matcher.start());
            ends.add(matcher.end());
            String headingPriority = matcher.group(2);
            String title = cleanTitle(matcher.group(3));
            Matcher headingPriorityMatcher = HEADING_PRIORITY.matcher(title);
            if ((headingPriority == null || headingPriority.isBlank()) && headingPriorityMatcher.matches()) {
                headingPriority = headingPriorityMatcher.group(1).toUpperCase(Locale.ROOT);
                title = cleanTitle(headingPriorityMatcher.group(2));
            }
            titles.add(title);
            headingPriorities.add(headingPriority);
        }

        List<StepDraft> steps = new ArrayList<>();
        for (int index = 0; index < titles.size(); index += 1) {
            int bodyEnd = index + 1 < starts.size() ? starts.get(index + 1) : section.length();
            String body = section.substring(ends.get(index), bodyEnd).trim();
            Matcher priorityMatcher = PRIORITY_LINE.matcher(body);
            String priority = valueOrDefault(headingPriorities.get(index), "");
            if (priority.isBlank() && priorityMatcher.find()) {
                priority = priorityMatcher.group(1).toUpperCase(Locale.ROOT);
            }
            if (priority.isBlank()) {
                priority = "P1";
            }
            String details = cleanMarkdown(PRIORITY_LINE.matcher(body).replaceAll("")).trim();
            steps.add(new StepDraft(titles.get(index), details, priority));
        }
        return steps;
    }

    private String cleanTitle(String title) {
        return cleanMarkdown(title).replaceAll("\\s+-\\s*$", "").trim();
    }

    private String cleanMarkdown(String value) {
        return value.replace("**", "").trim();
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
