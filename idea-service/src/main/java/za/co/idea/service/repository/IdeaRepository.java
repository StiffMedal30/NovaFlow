package za.co.idea.service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import za.co.idea.service.entity.IdeaEntity;

import java.util.List;

public interface IdeaRepository extends JpaRepository<IdeaEntity, Long> {
    List<IdeaEntity> findAllByStatusNotOrderByCreatedAtDesc(String status);
}
