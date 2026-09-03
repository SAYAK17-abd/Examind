package com.examind.backend.result.repository;

import com.examind.backend.result.entity.Result;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ResultRepository extends JpaRepository<Result, Long> {

    Optional<Result> findBySubmission_Id(Long submissionId);

    Page<Result> findByStudent_Id(Long studentId, Pageable pageable);

    Page<Result> findByExam_Id(Long examId, Pageable pageable);

    List<Result> findByExam_Id(Long examId);

    List<Result> findByStudent_Id(Long studentId);
}
