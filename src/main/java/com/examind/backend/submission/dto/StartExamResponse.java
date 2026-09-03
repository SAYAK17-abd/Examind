package com.examind.backend.submission.dto;

import com.examind.backend.question.dto.QuestionResponse;
import java.time.LocalDateTime;
import java.util.List;

public class StartExamResponse {

    private Long submissionId;
    private Long examId;
    private String examTitle;
    private LocalDateTime startedAt;
    private LocalDateTime dueAt;
    private Integer durationMinutes;
    private Long remainingSeconds;
    private List<QuestionResponse> questions;

    public StartExamResponse() {
    }

    public StartExamResponse(Long submissionId, Long examId, String examTitle, LocalDateTime startedAt, LocalDateTime dueAt, Integer durationMinutes, Long remainingSeconds, List<QuestionResponse> questions) {
        this.submissionId = submissionId;
        this.examId = examId;
        this.examTitle = examTitle;
        this.startedAt = startedAt;
        this.dueAt = dueAt;
        this.durationMinutes = durationMinutes;
        this.remainingSeconds = remainingSeconds;
        this.questions = questions;
    }

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
    }

    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getDueAt() {
        return dueAt;
    }

    public void setDueAt(LocalDateTime dueAt) {
        this.dueAt = dueAt;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public Long getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(Long remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public List<QuestionResponse> getQuestions() {
        return questions;
    }

    public void setQuestions(List<QuestionResponse> questions) {
        this.questions = questions;
    }
}
