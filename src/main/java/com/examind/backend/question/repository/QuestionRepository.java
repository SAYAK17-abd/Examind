package com.examind.backend.question.repository;

import com.examind.backend.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {

    List<Question> findByExam_IdOrderByOrderNumberAsc(Long examId);

    List<Question> findByExam_Id(Long examId);

    long countByExam_Id(Long examId);
}
