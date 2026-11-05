package com.examind.backend.scan.entity;

import com.examind.backend.exam.entity.Exam;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scan_results", indexes = {
        @Index(name = "idx_scan_results_exam", columnList = "exam_id"),
        @Index(name = "idx_scan_results_status", columnList = "status"),
        @Index(name = "idx_scan_results_student", columnList = "student_identifier")
})
public class ScanResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "original_filename", nullable = false)
    private String originalFilename;

    @Column(name = "student_identifier")
    private String studentIdentifier;

    @Column(name = "confidence", nullable = false)
    private Double confidence = 1.0;

    @Column(name = "requires_review", nullable = false)
    private Boolean requiresReview = false;

    @Column(name = "status", nullable = false, length = 30)
    private String status = "PENDING_REVIEW"; // PENDING_REVIEW, VERIFIED, GRADED, REJECTED

    @Column(name = "extracted_answers_json", columnDefinition = "TEXT")
    private String extractedAnswersJson;

    @Column(name = "teacher_notes", length = 1000)
    private String teacherNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public ScanResult() {
    }

    public ScanResult(Exam exam, String originalFilename, String studentIdentifier, Double confidence, Boolean requiresReview, String extractedAnswersJson) {
        this.exam = exam;
        this.originalFilename = originalFilename;
        this.studentIdentifier = studentIdentifier;
        this.confidence = confidence != null ? confidence : 1.0;
        this.requiresReview = requiresReview != null ? requiresReview : false;
        this.extractedAnswersJson = extractedAnswersJson;
        this.status = "PENDING_REVIEW";
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Exam getExam() {
        return exam;
    }

    public void setExam(Exam exam) {
        this.exam = exam;
    }

    public String getOriginalFilename() {
        return originalFilename;
    }

    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }

    public String getStudentIdentifier() {
        return studentIdentifier;
    }

    public void setStudentIdentifier(String studentIdentifier) {
        this.studentIdentifier = studentIdentifier;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public Boolean getRequiresReview() {
        return requiresReview;
    }

    public void setRequiresReview(Boolean requiresReview) {
        this.requiresReview = requiresReview;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getExtractedAnswersJson() {
        return extractedAnswersJson;
    }

    public void setExtractedAnswersJson(String extractedAnswersJson) {
        this.extractedAnswersJson = extractedAnswersJson;
    }

    public String getTeacherNotes() {
        return teacherNotes;
    }

    public void setTeacherNotes(String teacherNotes) {
        this.teacherNotes = teacherNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
