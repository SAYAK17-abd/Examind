package com.examind.backend.exam.repository;

import com.examind.backend.exam.entity.Exam;
import com.examind.backend.exam.entity.ExamStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {

    Page<Exam> findByCreatedBy_Id(Long teacherId, Pageable pageable);

    Page<Exam> findByStatus(ExamStatus status, Pageable pageable);

    @Query("SELECT e FROM Exam e WHERE e.status = :status AND e.endTime > :now")
    Page<Exam> findAvailableExamsForStudents(@Param("status") ExamStatus status,
                                            @Param("now") LocalDateTime now,
                                            Pageable pageable);

    long countByCreatedBy_Id(Long teacherId);
}
