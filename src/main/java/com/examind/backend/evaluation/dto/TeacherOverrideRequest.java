package com.examind.backend.evaluation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class TeacherOverrideRequest {

    @NotNull(message = "Score is required")
    @PositiveOrZero(message = "Score must be positive or zero")
    private Double score;

    @NotBlank(message = "Override reason is required for auditability")
    @Size(min = 5, max = 1000, message = "Reason must be between 5 and 1000 characters")
    private String reason;

    @Size(max = 5000, message = "Feedback must not exceed 5000 characters")
    private String feedback;

    public TeacherOverrideRequest() {
    }

    public TeacherOverrideRequest(Double score, String reason, String feedback) {
        this.score = score;
        this.reason = reason;
        this.feedback = feedback;
    }

    public Double getScore() {
        return score;
    }

    public void setScore(Double score) {
        this.score = score;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }
}
