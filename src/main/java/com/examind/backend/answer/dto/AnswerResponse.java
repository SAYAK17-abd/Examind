package com.examind.backend.answer.dto;

import com.examind.backend.answer.entity.Answer;
import java.time.LocalDateTime;

public class AnswerResponse {

    private Long id;
    private Long submissionId;
    private Long questionId;
    private String questionText;
    private String questionType;
    private Double maxMarks;
    private String answerText;
    private String attachmentUrl;
    private LocalDateTime submittedAt;

    public AnswerResponse() {
    }

    public static AnswerResponse fromEntity(Answer answer) {
        AnswerResponse dto = new AnswerResponse();
        dto.setId(answer.getId());
        dto.setSubmissionId(answer.getSubmission().getId());
        dto.setQuestionId(answer.getQuestion().getId());
        dto.setQuestionText(answer.getQuestion().getQuestionText());
        dto.setQuestionType(answer.getQuestion().getQuestionType().name());
        dto.setMaxMarks(answer.getQuestion().getMaxMarks());
        dto.setAnswerText(answer.getAnswerText());
        dto.setAttachmentUrl(answer.getAttachmentUrl());
        dto.setSubmittedAt(answer.getSubmittedAt());
        return dto;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSubmissionId() {
        return submissionId;
    }

    public void setSubmissionId(Long submissionId) {
        this.submissionId = submissionId;
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

    public String getQuestionType() {
        return questionType;
    }

    public void setQuestionType(String questionType) {
        this.questionType = questionType;
    }

    public Double getMaxMarks() {
        return maxMarks;
    }

    public void setMaxMarks(Double maxMarks) {
        this.maxMarks = maxMarks;
    }

    public String getAnswerText() {
        return answerText;
    }

    public void setAnswerText(String answerText) {
        this.answerText = answerText;
    }

    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }
}
