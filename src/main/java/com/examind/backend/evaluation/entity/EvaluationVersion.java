package com.examind.backend.evaluation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_versions", indexes = {
        @Index(name = "idx_eval_version_eval", columnList = "evaluation_id"),
        @Index(name = "idx_eval_version_num", columnList = "version_number")
})
public class EvaluationVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "score", nullable = false)
    private Double score;

    @Column(name = "confidence")
    private Double confidence;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private EvaluationStatus status;

    @Column(name = "feedback", length = 5000)
    private String feedback;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "changed_by", length = 100)
    private String changedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public EvaluationVersion() {
    }

    public EvaluationVersion(Evaluation evaluation, Integer versionNumber, Double score, Double confidence, EvaluationStatus status, String feedback, String reason, String changedBy) {
        this.evaluation = evaluation;
        this.versionNumber = versionNumber;
        this.score = score;
        this.confidence = confidence;
        this.status = status;
        this.feedback = feedback;
        this.reason = reason;
        this.changedBy = changedBy;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Evaluation getEvaluation() {
        return evaluation;
    }

    public void setEvaluation(Evaluation evaluation) {
        this.evaluation = evaluation;
    }

    public Integer getVersionNumber() {
        return versionNumber;
    }

    public void setVersionNumber(Integer versionNumber) {
        this.versionNumber = versionNumber;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public EvaluationStatus getStatus() {
        return status;
    }

    public void setStatus(EvaluationStatus status) {
        this.status = status;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getChangedBy() {
        return changedBy;
    }

    public void setChangedBy(String changedBy) {
        this.changedBy = changedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
