package com.examind.backend.evaluation.dto;

import com.examind.backend.evaluation.entity.EvaluationVersion;
import java.time.LocalDateTime;

public class EvaluationVersionResponse {

    private Integer versionNumber;
    private Double score;
    private Double confidence;
    private String status;
    private String feedback;
    private String reason;
    private String changedBy;
    private LocalDateTime createdAt;

    public EvaluationVersionResponse() {
    }

    public static EvaluationVersionResponse fromEntity(EvaluationVersion ev) {
        EvaluationVersionResponse res = new EvaluationVersionResponse();
        res.setVersionNumber(ev.getVersionNumber());
        res.setScore(ev.getScore());
        res.setConfidence(ev.getConfidence());
        res.setStatus(ev.getStatus().name());
        res.setFeedback(ev.getFeedback());
        res.setReason(ev.getReason());
        res.setChangedBy(ev.getChangedBy());
        res.setCreatedAt(ev.getCreatedAt());
        return res;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
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
