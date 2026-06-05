package za.co.idea.service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.idea.service.entity.IdeaStepEntity;

import java.util.List;
import java.util.Optional;

public interface IdeaStepRepository extends JpaRepository<IdeaStepEntity, Long> {
    List<IdeaStepEntity> findAllByIdeaIdOrderByPosition(Long ideaId);
    Optional<IdeaStepEntity> findByIdAndIdeaId(Long id, Long ideaId);
    void deleteAllByIdeaId(Long ideaId);
}
