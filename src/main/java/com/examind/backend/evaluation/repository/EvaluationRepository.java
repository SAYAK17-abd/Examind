package com.examind.backend.evaluation.repository;

import com.examind.backend.evaluation.entity.Evaluation;
import com.examind.backend.evaluation.entity.EvaluationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    Optional<Evaluation> findByAnswer_Id(Long answerId);

    List<Evaluation> findByAnswer_Submission_Id(Long submissionId);

    List<Evaluation> findByAnswer_Question_Exam_Id(Long examId);

    long countByAnswer_Question_Exam_IdAndStatus(Long examId, EvaluationStatus status);

    @Query("SELECT AVG(e.score) FROM Evaluation e WHERE e.answer.question.id = :questionId")
    Double calculateAverageScoreByQuestion(@Param("questionId") Long questionId);

    @Query("SELECT AVG(e.confidence) FROM Evaluation e WHERE e.answer.question.exam.id = :examId")
    Double calculateAverageConfidenceByExam(@Param("examId") Long examId);
}
