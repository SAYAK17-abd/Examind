package com.examind.backend.evaluation.repository;

import com.examind.backend.evaluation.entity.EvaluationVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationVersionRepository extends JpaRepository<EvaluationVersion, Long> {

    List<EvaluationVersion> findByEvaluation_IdOrderByVersionNumberAsc(Long evaluationId);
}
