package com.examind.backend.rubric.repository;

import com.examind.backend.rubric.entity.Rubric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RubricRepository extends JpaRepository<Rubric, Long> {

    Optional<Rubric> findByQuestion_Id(Long questionId);

    boolean existsByQuestion_Id(Long questionId);
}
