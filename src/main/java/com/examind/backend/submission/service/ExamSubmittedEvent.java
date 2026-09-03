package com.examind.backend.submission.service;

public class ExamSubmittedEvent {

    private final Long submissionId;

    public ExamSubmittedEvent(Long submissionId) {
        this.submissionId = submissionId;
    }

    public Long getSubmissionId() {
        return submissionId;
    }
}
