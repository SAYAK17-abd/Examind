package com.examind.backend.answer.repository;

import com.examind.backend.answer.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    List<Answer> findBySubmission_Id(Long submissionId);

    Optional<Answer> findBySubmission_IdAndQuestion_Id(Long submissionId, Long questionId);

    List<Answer> findByQuestion_Id(Long questionId);

    long countBySubmission_Id(Long submissionId);
}
