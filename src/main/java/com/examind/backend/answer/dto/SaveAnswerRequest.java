package com.examind.backend.answer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class SaveAnswerRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    @Size(max = 10000, message = "Answer text must not exceed 10000 characters")
    private String answerText;

    @Size(max = 500, message = "Attachment URL must not exceed 500 characters")
    private String attachmentUrl;

    public SaveAnswerRequest() {
    }

    public SaveAnswerRequest(Long questionId, String answerText, String attachmentUrl) {
        this.questionId = questionId;
        this.answerText = answerText;
        this.attachmentUrl = attachmentUrl;
    }

    public Long getQuestionId() {
        return questionId;
    }

    public void setQuestionId(Long questionId) {
        this.questionId = questionId;
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
}
