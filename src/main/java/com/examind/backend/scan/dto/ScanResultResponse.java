package com.examind.backend.scan.dto;

import com.examind.backend.scan.entity.ScanResult;
import java.time.LocalDateTime;

public class ScanResultResponse {

    private Long id;
    private Long examId;
    private String originalFilename;
    private String studentIdentifier;
    private Double confidence;
    private Boolean requiresReview;
    private String status;
    private String extractedAnswersJson;
    private String teacherNotes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ScanResultResponse() {
    }

    public static ScanResultResponse fromEntity(ScanResult scan) {
        ScanResultResponse dto = new ScanResultResponse();
        dto.setId(scan.getId());
        dto.setExamId(scan.getExam().getId());
        dto.setOriginalFilename(scan.getOriginalFilename());
        dto.setStudentIdentifier(scan.getStudentIdentifier());
        dto.setConfidence(scan.getConfidence());
        dto.setRequiresReview(scan.getRequiresReview());
        dto.setStatus(scan.getStatus());
        dto.setExtractedAnswersJson(scan.getExtractedAnswersJson());
        dto.setTeacherNotes(scan.getTeacherNotes());
        dto.setCreatedAt(scan.getCreatedAt());
        dto.setUpdatedAt(scan.getUpdatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
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
