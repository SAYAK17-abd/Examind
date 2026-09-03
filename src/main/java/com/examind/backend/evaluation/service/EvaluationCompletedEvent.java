package com.examind.backend.evaluation.service;

public class EvaluationCompletedEvent {

    private final Long submissionId;

    public EvaluationCompletedEvent(Long submissionId) {
        this.submissionId = submissionId;
    }

    public Long getSubmissionId() {
        return submissionId;
    }
}
