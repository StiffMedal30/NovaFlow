package za.co.idea.service.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import za.co.idea.service.client.AiServiceClient;
import za.co.idea.service.entity.IdeaEntity;
import za.co.idea.service.records.AiServiceResponse;
import za.co.idea.service.records.IdeaRefinementRequest;
import za.co.idea.service.repository.IdeaRepository;
import za.co.idea.service.repository.IdeaStepRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IdeaServiceImplTest {

    @Test
    void createsStructuredStepsFromAnExistingMarkdownPlan() {
        IdeaRepository ideaRepository = mock(IdeaRepository.class);
        IdeaStepRepository stepRepository = mock(IdeaStepRepository.class);
        IdeaServiceImpl service = new IdeaServiceImpl(mock(AiServiceClient.class), ideaRepository, stepRepository);

        IdeaEntity idea = new IdeaEntity();
        ReflectionTestUtils.setField(idea, "id", 42L);
        idea.setTitle("Test idea");
        idea.setDescription("Test description");
        idea.setStatus("ACTIVE");
        idea.setAiProcessed(true);
        idea.setAiResponse("""
                ## Goal
                Build the thing.

                ## Prioritized steps
                1. Validate the problem
                - Priority: P0
                - Outcome: Evidence from real users
                - Actions:
                  - Interview five people
                - Done when: Findings are documented

                2. Build the smallest prototype
                - Priority: P1
                - Outcome: A testable workflow
                - Done when: A user completes the workflow

                ## Immediate next move
                Book the first interview.
                """);

        when(ideaRepository.findById(42L)).thenReturn(Optional.of(idea));
        when(stepRepository.findAllByIdeaIdOrderByPosition(42L)).thenReturn(List.of());
        when(stepRepository.saveAll(anyList())).thenAnswer(invocation -> new ArrayList<>(invocation.getArgument(0)));

        var response = service.getIdea(42L);

        assertThat(response.steps()).hasSize(2);
        assertThat(response.steps().get(0).title()).isEqualTo("Validate the problem");
        assertThat(response.steps().get(0).priority()).isEqualTo("P0");
        assertThat(response.steps().get(0).details()).contains("Interview five people");
        assertThat(response.steps().get(1).title()).isEqualTo("Build the smallest prototype");
        assertThat(response.steps().get(1).priority()).isEqualTo("P1");
    }

    @Test
    void createsStructuredStepsFromBoldMarkdownPlanHeadings() {
        IdeaRepository ideaRepository = mock(IdeaRepository.class);
        IdeaStepRepository stepRepository = mock(IdeaStepRepository.class);
        IdeaServiceImpl service = new IdeaServiceImpl(mock(AiServiceClient.class), ideaRepository, stepRepository);

        IdeaEntity idea = new IdeaEntity();
        ReflectionTestUtils.setField(idea, "id", 42L);
        idea.setTitle("Test idea");
        idea.setDescription("Test description");
        idea.setStatus("ACTIVE");
        idea.setAiProcessed(true);
        idea.setAiResponse("""
                ## Goal
                Build the thing.

                ## Prioritized steps

                1) **Define the guided brief schema + first-pass phrasing**
                - **Priority:** P0
                - **Outcome:** A fixed set of sections to drive the UI.
                - **Actions:**
                  - Pick 6-10 sections.

                2) **Design the smoke-test user flow and minimal UX**
                - **Priority:** P1
                - **Outcome:** A clickable flow.

                ## Immediate next move
                Draft the guided brief schema.
                """);

        when(ideaRepository.findById(42L)).thenReturn(Optional.of(idea));
        when(stepRepository.findAllByIdeaIdOrderByPosition(42L)).thenReturn(List.of());
        when(stepRepository.saveAll(anyList())).thenAnswer(invocation -> new ArrayList<>(invocation.getArgument(0)));

        var response = service.getIdea(42L);

        assertThat(response.steps()).hasSize(2);
        assertThat(response.steps().get(0).title()).isEqualTo("Define the guided brief schema + first-pass phrasing");
        assertThat(response.steps().get(0).priority()).isEqualTo("P0");
        assertThat(response.steps().get(0).details()).contains("Pick 6-10 sections");
        assertThat(response.steps().get(1).title()).isEqualTo("Design the smoke-test user flow and minimal UX");
        assertThat(response.steps().get(1).priority()).isEqualTo("P1");
    }

    @Test
    void createsStructuredStepsFromBulletMarkdownPlan() {
        IdeaRepository ideaRepository = mock(IdeaRepository.class);
        IdeaStepRepository stepRepository = mock(IdeaStepRepository.class);
        IdeaServiceImpl service = new IdeaServiceImpl(mock(AiServiceClient.class), ideaRepository, stepRepository);

        IdeaEntity idea = new IdeaEntity();
        ReflectionTestUtils.setField(idea, "id", 42L);
        idea.setTitle("Test idea");
        idea.setDescription("Test description");
        idea.setStatus("ACTIVE");
        idea.setAiProcessed(true);
        idea.setAiResponse("""
                ## Goal
                Build the thing.

                ## Prioritized steps
                - P0 - Define scope and compliance boundaries
                  - Outcome: A clear MVP scope.
                  - Actions:
                    - Pick 1-2 countries.
                    - Write the disclaimer copy.
                  - Done when: A one-page scope exists.

                - P1 - Model the user journey
                  - Outcome: A trackable checklist flow.
                  - Actions:
                    - Map eligibility, documents, submission, waiting, and arrival.

                ## Immediate next move
                Draft the scope.
                """);

        when(ideaRepository.findById(42L)).thenReturn(Optional.of(idea));
        when(stepRepository.findAllByIdeaIdOrderByPosition(42L)).thenReturn(List.of());
        when(stepRepository.saveAll(anyList())).thenAnswer(invocation -> new ArrayList<>(invocation.getArgument(0)));

        var response = service.getIdea(42L);

        assertThat(response.steps()).hasSize(2);
        assertThat(response.steps().get(0).title()).isEqualTo("Define scope and compliance boundaries");
        assertThat(response.steps().get(0).priority()).isEqualTo("P0");
        assertThat(response.steps().get(0).details()).contains("Pick 1-2 countries");
        assertThat(response.steps().get(1).title()).isEqualTo("Model the user journey");
        assertThat(response.steps().get(1).priority()).isEqualTo("P1");
    }

    @Test
    void explainRefinementReturnsAssistantOutputWithoutChangingThePlan() {
        AiServiceClient aiClient = mock(AiServiceClient.class);
        IdeaRepository ideaRepository = mock(IdeaRepository.class);
        IdeaStepRepository stepRepository = mock(IdeaStepRepository.class);
        IdeaServiceImpl service = new IdeaServiceImpl(aiClient, ideaRepository, stepRepository);
        IdeaEntity idea = savedIdea();

        when(ideaRepository.findById(42L)).thenReturn(Optional.of(idea));
        when(aiClient.refineIdea(any())).thenReturn(new AiServiceResponse("This step validates demand before build work starts."));
        when(stepRepository.findAllByIdeaIdOrderByPosition(42L)).thenReturn(List.of());

        var response = service.refineIdea(42L, new IdeaRefinementRequest(
                "EXPLAIN",
                "Prioritized steps",
                "## Prioritized steps\n1. Validate demand",
                "Why is this first?"
        ));

        assertThat(response.planUpdated()).isFalse();
        assertThat(response.refinement()).isEqualTo(idea.getAiResponse());
        assertThat(response.assistantOutput()).contains("validates demand");
        verify(ideaRepository, never()).save(any());
    }

    @Test
    void updateRefinementSavesTheNewPlanAndRebuildsStructuredSteps() {
        AiServiceClient aiClient = mock(AiServiceClient.class);
        IdeaRepository ideaRepository = mock(IdeaRepository.class);
        IdeaStepRepository stepRepository = mock(IdeaStepRepository.class);
        IdeaServiceImpl service = new IdeaServiceImpl(aiClient, ideaRepository, stepRepository);
        IdeaEntity idea = savedIdea();
        String updatedPlan = """
                ## Goal
                Build a sharper validation flow.

                ## Key assumptions
                - Users will give feedback if the prototype is small.

                ## Prioritized steps
                1. Interview target users
                - Priority: P0
                - Outcome: Validated pain points
                - Actions:
                  - Book five interviews
                - Done when: Notes are summarized

                ## Immediate next move
                Write the interview script.
                """;

        when(ideaRepository.findById(42L)).thenReturn(Optional.of(idea));
        when(ideaRepository.save(any(IdeaEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(aiClient.refineIdea(any())).thenReturn(new AiServiceResponse(updatedPlan));
        when(stepRepository.saveAll(anyList())).thenAnswer(invocation -> new ArrayList<>(invocation.getArgument(0)));

        var response = service.refineIdea(42L, new IdeaRefinementRequest(
                "ADD_STEPS",
                "Prioritized steps",
                "## Prioritized steps",
                "Add interview validation"
        ));

        assertThat(response.planUpdated()).isTrue();
        assertThat(response.refinement()).contains("Interview target users");
        assertThat(response.steps()).hasSize(1);
        assertThat(response.steps().get(0).priority()).isEqualTo("P0");
        assertThat(idea.getAiResponse()).isEqualTo(updatedPlan);
    }

    private IdeaEntity savedIdea() {
        IdeaEntity idea = new IdeaEntity();
        ReflectionTestUtils.setField(idea, "id", 42L);
        idea.setTitle("Test idea");
        idea.setDescription("Test description");
        idea.setProblem("The current workflow is manual.");
        idea.setGoal("Make the workflow easier to plan.");
        idea.setStatus("ACTIVE");
        idea.setAiProcessed(true);
        idea.setAiResponse("""
                ## Goal
                Build the thing.

                ## Prioritized steps
                1. Validate the problem
                - Priority: P0
                - Outcome: Evidence from real users

                ## Immediate next move
                Book the first interview.
                """);
        return idea;
    }
}
