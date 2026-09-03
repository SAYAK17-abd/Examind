package com.examind.backend.similarity.repository;

import com.examind.backend.similarity.entity.AnswerSimilarity;
import com.examind.backend.similarity.entity.SimilarityStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerSimilarityRepository extends JpaRepository<AnswerSimilarity, Long> {

    @Query("SELECT s FROM AnswerSimilarity s WHERE s.answer1.question.exam.id = :examId ORDER BY s.similarityScore DESC")
    List<AnswerSimilarity> findByExamId(@Param("examId") Long examId);

    @Query("SELECT s FROM AnswerSimilarity s WHERE s.answer1.question.exam.id = :examId AND s.status = :status ORDER BY s.similarityScore DESC")
    List<AnswerSimilarity> findByExamIdAndStatus(@Param("examId") Long examId, @Param("status") SimilarityStatus status);
}
