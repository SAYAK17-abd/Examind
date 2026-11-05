package com.examind.backend.scan.repository;

import com.examind.backend.scan.entity.ScanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScanResultRepository extends JpaRepository<ScanResult, Long> {

    List<ScanResult> findByExam_IdOrderByCreatedAtDesc(Long examId);

    long countByExam_IdAndRequiresReviewTrue(Long examId);
}
