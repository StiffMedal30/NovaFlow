package za.co.idea.service.service.impl;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import za.co.idea.service.client.AiServiceClient;
import za.co.idea.service.entity.IdeaEntity;
import za.co.idea.service.repository.IdeaRepository;
import za.co.idea.service.repository.IdeaStepRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
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
}
