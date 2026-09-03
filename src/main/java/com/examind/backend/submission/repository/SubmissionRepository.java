package com.examind.backend.submission.repository;

import com.examind.backend.submission.entity.Submission;
import com.examind.backend.submission.entity.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    Optional<Submission> findByExam_IdAndStudent_Id(Long examId, Long studentId);

    boolean existsByExam_IdAndStudent_Id(Long examId, Long studentId);

    Page<Submission> findByStudent_Id(Long studentId, Pageable pageable);

    Page<Submission> findByExam_Id(Long examId, Pageable pageable);

    List<Submission> findByExam_Id(Long examId);

    long countByExam_Id(Long examId);

    long countByExam_IdAndStatus(Long examId, SubmissionStatus status);
}
