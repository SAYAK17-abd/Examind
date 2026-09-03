package com.examind.backend.similarity.dto;

import com.examind.backend.similarity.entity.AnswerSimilarity;
import java.time.LocalDateTime;

public class SimilarityReportDto {

    private Long id;
    private Long questionId;
    private String questionText;
    private Long student1Id;
    private String student1Name;
    private Long student2Id;
    private String student2Name;
    private Double similarityScore;
    private Double similarityPercentage;
    private String status;
    private LocalDateTime checkedAt;

    public SimilarityReportDto() {
    }

    public static SimilarityReportDto fromEntity(AnswerSimilarity entity) {
        SimilarityReportDto dto = new SimilarityReportDto();
        dto.setId(entity.getId());
        dto.setQuestionId(entity.getAnswer1().getQuestion().getId());
        dto.setQuestionText(entity.getAnswer1().getQuestion().getQuestionText());
        dto.setStudent1Id(entity.getAnswer1().getSubmission().getStudent().getId());
        dto.setStudent1Name(entity.getAnswer1().getSubmission().getStudent().getFullName());
        dto.setStudent2Id(entity.getAnswer2().getSubmission().getStudent().getId());
        dto.setStudent2Name(entity.getAnswer2().getSubmission().getStudent().getFullName());
        dto.setSimilarityScore(entity.getSimilarityScore());
        dto.setSimilarityPercentage(Math.round(entity.getSimilarityScore() * 1000.0) / 10.0);
        dto.setStatus(entity.getStatus().name());
        dto.setCheckedAt(entity.getCreatedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
    }

    public String getQuestionText() {
        return questionText;
    }

    public void setQuestionText(String questionText) {
        this.questionText = questionText;
    }

    public Long getStudent1Id() {
        return student1Id;
    }

    public void setStudent1Id(Long student1Id) {
        this.student1Id = student1Id;
    }

    public String getStudent1Name() {
        return student1Name;
    }

    public void setStudent1Name(String student1Name) {
        this.student1Name = student1Name;
    }

    public Long getStudent2Id() {
        return student2Id;
    }

    public void setStudent2Id(Long student2Id) {
        this.student2Id = student2Id;
    }

    public String getStudent2Name() {
        return student2Name;
    }

    public void setStudent2Name(String student2Name) {
        this.student2Name = student2Name;
    }

    public Double getSimilarityScore() {
        return similarityScore;
    }

    public void setSimilarityScore(Double similarityScore) {
        this.similarityScore = similarityScore;
    }

    public Double getSimilarityPercentage() {
        return similarityPercentage;
    }

    public void setSimilarityPercentage(Double similarityPercentage) {
        this.similarityPercentage = similarityPercentage;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(LocalDateTime checkedAt) {
        this.checkedAt = checkedAt;
    }
}
